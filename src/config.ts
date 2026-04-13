import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "solana-pools",
  slug: "solana-pools",
  description: "Solana DEX pool liquidity depth -- TVL, slippage at 1/2/5%, volume, fee tier. Raydium, Orca, Meteora.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/pool",
      price: "$0.003",
      description: "Get liquidity depth for Solana DEX pools by token mint",
      toolName: "solana_scan_pool_liquidity",
      toolDescription: `Use this when you need to check liquidity depth of a Solana DEX pool before trading. Returns TVL, slippage estimates, volume, and fee tier for pools matching a token mint.

1. pools: array of DEX pools for the given token
2. Each pool contains: dex (Raydium/Orca/Meteora), pairName, tvlUsd, volume24h, feeTier, poolAge
3. depth: slippage estimates at 1%, 2%, 5% trade sizes in USD
4. bestPool: the pool with deepest liquidity
5. totalTvl: combined TVL across all pools for this token

Example output: {"pools":[{"dex":"Raydium","pairName":"SOL/USDC","tvlUsd":45000000,"volume24h":12000000,"feeTier":0.25,"poolAge":"342d"}],"depth":{"1pct":500000,"2pct":950000,"5pct":2100000},"bestPool":"Raydium SOL/USDC","totalTvl":62000000}

Use this BEFORE executing large swaps to estimate slippage. Essential for position sizing, liquidity analysis, and avoiding thin pools.

Do NOT use for swap quotes -- use jupiter_get_swap_quote. Do NOT use for new token launches -- use solana_scan_new_tokens. Do NOT use for Solana fees -- use solana_get_priority_fees.`,
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
      outputSchema: {
          "type": "object",
          "properties": {
            "chain": {
              "type": "string",
              "description": "Chain (solana)"
            },
            "mint": {
              "type": "string",
              "description": "Token mint address"
            },
            "results": {
              "type": "number",
              "description": "Number of pools found"
            },
            "bestPool": {
              "type": "string",
              "description": "Best pool by liquidity"
            },
            "bestLiquidity": {
              "type": "string",
              "description": "Best pool liquidity formatted"
            },
            "pools": {
              "type": "array",
              "items": {
                "type": "object"
              }
            },
            "timestamp": {
              "type": "string"
            }
          },
          "required": [
            "chain",
            "mint",
            "results",
            "pools"
          ]
        },
    },
  ],
};
