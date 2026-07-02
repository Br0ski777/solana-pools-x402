# Solana Pool Liquidity Scanner API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://solana-pools.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Solana DEX pool liquidity depth -- TVL, slippage at 1/2/5%, volume, fee tier. Raydium, Orca, Meteora. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "solana-pools": {
      "url": "https://solana-pools.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl "https://solana-pools.api.klymax402.com/api/pool?mint=..."
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `solana_scan_pool_liquidity` | GET | `/api/pool` | $0.003 | Get liquidity depth for Solana DEX pools by token mint |

### `solana_scan_pool_liquidity`

Use this when you need to check liquidity depth of a Solana DEX pool before trading. Returns TVL, slippage estimates, volume, and fee tier for pools matching a token mint.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `mint` | string | yes | Solana token mint address to look up pools for (e.g. So11111111111111111111111111111111111111112 for SOL). |

**Returns**

- `pools` -- array of DEX pools for the given token
- `depth` -- slippage estimates at 1%, 2%, 5% trade sizes in USD
- `bestPool` -- the pool with deepest liquidity
- `totalTvl` -- combined TVL across all pools for this token

Example response:

```json
{"pools":[{"dex":"Raydium","pairName":"SOL/USDC","tvlUsd":45000000,"volume24h":12000000,"feeTier":0.25,"poolAge":"342d"}],"depth":{"1pct":500000,"2pct":950000,"5pct":2100000},"bestPool":"Raydium SOL/USDC","totalTvl":62000000}
```

**When to use**: executing large swaps to estimate slippage. Essential for position sizing, liquidity analysis, and avoiding thin pools.

## Example agent prompts

- "Check liquidity depth of a Solana DEX pool before trading"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
