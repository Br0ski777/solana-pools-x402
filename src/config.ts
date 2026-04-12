import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "solana-pools",
  slug: "solana-pools",
  description: "Liquidity depth scanner for Solana DEX pools via DexScreener.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/pool",
      price: "$0.003",
      description: "Get liquidity depth for Solana DEX pools by token mint",
      toolName: "solana_scan_pool_liquidity",
      toolDescription: "Use this when you need to check liquidity depth of a Solana DEX pool before trading. Returns TVL, depth at 1%/2%/5% slippage, volume 24h, fee tier, pool age. Covers Raydium, Orca, Meteora. Do NOT use for swap quotes — use jupiter_get_swap_quote. Do NOT use for new launches — use solana_scan_new_tokens.",
      inputSchema: {
        type: "object",
        properties: {
          mint: {
            type: "string",
            description: "Solana token mint address to look up pools for (e.g. So11111111111111111111111111111111111111112 for SOL).",
          },
        },
        required: ["mint"],
      },
    },
  ],
};
