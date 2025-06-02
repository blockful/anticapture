# Historical Balances Service

This service provides functionality to fetch historical token balances for multiple addresses at a specific block number using Viem's multicall functionality.

## Features

- ✅ Batch balance queries using multicall for efficiency
- ✅ Support for multiple DAOs (ENS, UNI, ARB)
- ✅ Historical block-specific queries
- ✅ Input validation and error handling
- ✅ Rate limiting (max 100 addresses per request)
- ✅ Block number validation (not too old, not in future)

## API Endpoint

### POST `/historical-balances/{daoId}`

Fetch historical token balances for multiple addresses at a specific block number.

#### Parameters

- **daoId** (path): The DAO identifier (`ENS`, `UNI`, `ARB`)
- **addresses** (body): Array of Ethereum addresses (max 100)
- **blockNumber** (body): The block number to query

#### Request Example

```bash
curl -X POST http://localhost:42069/historical-balances/ENS \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "0x123456789abcdef123456789abcdef123456789a",
      "0x987654321fedcba987654321fedcba987654321b"
    ],
    "blockNumber": 18500000
  }'
```

#### Response Example

```json
{
  "data": [
    {
      "address": "0x123456789abcdef123456789abcdef123456789a",
      "balance": "1000000000000000000000",
      "blockNumber": 18500000,
      "tokenAddress": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"
    },
    {
      "address": "0x987654321fedcba987654321fedcba987654321b", 
      "balance": "500000000000000000000",
      "blockNumber": 18500000,
      "tokenAddress": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"
    }
  ],
  "metadata": {
    "totalAddresses": 2,
    "blockNumber": 18500000,
    "daoId": "ENS",
    "tokenAddress": "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"
  }
}
```

## Supported DAOs

| DAO ID | Token Name | Network | Token Contract |
|--------|------------|---------|----------------|
| ENS    | ENS        | Ethereum | 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72 |
| UNI    | Uniswap    | Ethereum | 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 |
| ARB    | Arbitrum   | Arbitrum | 0x912CE59144191C1204E64559FE8253a0e49E6548 |

## Error Handling

The service includes comprehensive error handling:

- **400 Bad Request**: Invalid input parameters
- **500 Internal Server Error**: RPC or service errors

### Common Error Scenarios

1. **Invalid addresses**: Non-Ethereum address format
2. **Too many addresses**: More than 100 addresses in request
3. **Invalid block number**: Block in future or too old
4. **RPC errors**: Network connectivity or node issues

## Implementation Details

### Multicall Optimization

The service uses Viem's `multicall` function to batch multiple `balanceOf` calls into a single RPC request, significantly improving performance compared to individual calls.

### Block Validation

- Prevents queries for future blocks
- Limits historical queries to prevent excessive load (configurable, default 1M blocks back)

### Rate Limiting

- Maximum 100 addresses per request
- Can be extended with additional rate limiting middleware

## Usage in Frontend

This endpoint is designed to support frontend features like:

- Token holder balance variations over time
- Historical analysis charts
- Portfolio tracking
- DAO participation metrics

The batch nature of the API makes it suitable for efficiently loading data for multiple addresses simultaneously. 