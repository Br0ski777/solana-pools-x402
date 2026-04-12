import type { Hono } from "hono";

// In-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 15 * 1000; // 15 seconds
const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens";
const SUPPORTED_DEXES = ["raydium", "orca", "meteora"];

interface PoolResult {
  pairAddress: string;
  dex: string;
  baseToken: { symbol: string; name: string; address: string };
  quoteToken: { symbol: string; name: string; address: string };
  priceUsd: string;
  liquidityUsd: number;
  volume24h: number;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  txns24h: { buys: number; sells: number };
  fdv: number | null;
  pairCreatedAt: string | null;
  depthRating: "deep" | "moderate" | "shallow";
  depthEstimate: {
    slippage1pct: string;
    slippage2pct: string;
    slippage5pct: string;
  };
}

function estimateDepth(liquidityUsd: number): {
  rating: "deep" | "moderate" | "shallow";
  estimate: { slippage1pct: string; slippage2pct: string; slippage5pct: string };
} {
  if (liquidityUsd >= 1_000_000) {
    return {
      rating: "deep",
      estimate: {
        slippage1pct: `~$${Math.round(liquidityUsd * 0.01).toLocaleString()} tradeable`,
        slippage2pct: `~$${Math.round(liquidityUsd * 0.02).toLocaleString()} tradeable`,
        slippage5pct: `~$${Math.round(liquidityUsd * 0.05).toLocaleString()} tradeable`,
      },
    };
  } else if (liquidityUsd >= 100_000) {
    return {
      rating: "moderate",
      estimate: {
        slippage1pct: `~$${Math.round(liquidityUsd * 0.008).toLocaleString()} tradeable`,
        slippage2pct: `~$${Math.round(liquidityUsd * 0.016).toLocaleString()} tradeable`,
        slippage5pct: `~$${Math.round(liquidityUsd * 0.04).toLocaleString()} tradeable`,
      },
    };
  } else {
    return {
      rating: "shallow",
      estimate: {
        slippage1pct: `~$${Math.round(liquidityUsd * 0.005).toLocaleString()} tradeable`,
        slippage2pct: `~$${Math.round(liquidityUsd * 0.01).toLocaleString()} tradeable`,
        slippage5pct: `~$${Math.round(liquidityUsd * 0.025).toLocaleString()} tradeable`,
      },
    };
  }
}

async function fetchPoolsForToken(mint: string): Promise<PoolResult[]> {
  const cacheKey = `pools_${mint}`;
  const cached = getCached<PoolResult[]>(cacheKey);
  if (cached) return cached;

  const resp = await fetch(`${DEXSCREENER_API}/${mint}`);
  if (!resp.ok) {
    throw new Error(`DexScreener API error: ${resp.status} ${resp.statusText}`);
  }

  const data: any = await resp.json();
  const pairs: any[] = data?.pairs || [];

  // Filter for Solana chain only
  const solanaPairs = pairs.filter(
    (p: any) => p.chainId === "solana"
  );

  // Sort by liquidity descending
  solanaPairs.sort((a: any, b: any) => {
    const liqA = a.liquidity?.usd || 0;
    const liqB = b.liquidity?.usd || 0;
    return liqB - liqA;
  });

  // Take top 5
  const top5 = solanaPairs.slice(0, 5);

  const results: PoolResult[] = top5.map((p: any) => {
    const liquidityUsd = p.liquidity?.usd || 0;
    const { rating, estimate } = estimateDepth(liquidityUsd);

    return {
      pairAddress: p.pairAddress || "",
      dex: p.dexId || "unknown",
      baseToken: {
        symbol: p.baseToken?.symbol || "",
        name: p.baseToken?.name || "",
        address: p.baseToken?.address || "",
      },
      quoteToken: {
        symbol: p.quoteToken?.symbol || "",
        name: p.quoteToken?.name || "",
        address: p.quoteToken?.address || "",
      },
      priceUsd: p.priceUsd || "0",
      liquidityUsd,
      volume24h: p.volume?.h24 || 0,
      priceChange: {
        m5: p.priceChange?.m5 || 0,
        h1: p.priceChange?.h1 || 0,
        h6: p.priceChange?.h6 || 0,
        h24: p.priceChange?.h24 || 0,
      },
      txns24h: {
        buys: p.txns?.h24?.buys || 0,
        sells: p.txns?.h24?.sells || 0,
      },
      fdv: p.fdv || null,
      pairCreatedAt: p.pairCreatedAt
        ? new Date(p.pairCreatedAt).toISOString()
        : null,
      depthRating: rating,
      depthEstimate: estimate,
    };
  });

  setCache(cacheKey, results);
  return results;
}

export function registerRoutes(app: Hono) {
  app.get("/api/pool", async (c) => {
    const mint = c.req.query("mint");

    if (!mint) {
      return c.json({ error: "Missing required parameter: mint (Solana token mint address)" }, 400);
    }

    try {
      const pools = await fetchPoolsForToken(mint);

      if (pools.length === 0) {
        return c.json({
          chain: "solana",
          mint,
          results: 0,
          pools: [],
          message: "No Solana DEX pools found for this token. Verify the mint address is correct.",
        });
      }

      return c.json({
        chain: "solana",
        mint,
        results: pools.length,
        bestPool: pools[0].dex,
        bestLiquidity: `$${pools[0].liquidityUsd.toLocaleString()}`,
        cachedFor: "15s",
        timestamp: new Date().toISOString(),
        pools,
      });
    } catch (err: any) {
      return c.json({ error: "Failed to fetch pool data", details: err.message }, 502);
    }
  });
}
