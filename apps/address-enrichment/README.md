# Address Enrichment Service

A service that enriches Ethereum addresses with labels from Arkham Intel API and determines whether addresses are EOAs or contracts.

## Features

- **Arkham Labels**: Fetches entity names and labels from Arkham Intel API
- **Address Type Detection**: Determines if an address is an EOA or contract via RPC
- **Permanent Storage**: Data is stored permanently in PostgreSQL (no TTL, no cache invalidation)
- **OpenAPI Documentation**: Swagger UI available at `/docs`

## API Endpoints

### `GET /address/:address`

Returns enriched data for an Ethereum address.

**Response:**

```json
{
  "address": "0x245445940b317e509002eb682e03f4429184059d",
  "isContract": false,
  "arkham": {
    "entity": "Upbit",
    "entityType": "cex",
    "label": "Cold Wallet"
  },
  "createdAt": "2024-01-20T10:30:00.000Z"
}
```

### `GET /health`

Health check endpoint.

## Environment Variables

| Variable              | Description                  | Required                                           |
| --------------------- | ---------------------------- | -------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | Yes                                                |
| `ARKHAM_API_KEY`      | Arkham Intel API key         | Yes                                                |
| `ARKHAM_API_URL`      | Arkham API base URL          | No (default: `https://api.arkhamintelligence.com`) |
| `RPC_URL`             | Ethereum RPC URL             | Yes                                                |
| `ANTICAPTURE_API_URL` | Anticapture GraphQL API URL  | Yes (for sync command)                             |
| `PORT`                | Server port                  | No (default: `3001`)                               |

## Development

```bash
# From monorepo root
pnpm address-enrichment dev

# Run database migrations
pnpm address-enrichment db:push

# Type check
pnpm address-enrichment typecheck

# Lint
pnpm address-enrichment lint
```

## Sync Command

Batch-sync top addresses from Anticapture API (delegates + token holders):

```bash
# Sync top 100 delegates and top 100 token holders
pnpm address-enrichment sync --limit 100

# Sync only delegates
pnpm address-enrichment sync --limit 50 --delegates-only

# Sync only token holders
pnpm address-enrichment sync --limit 50 --holders-only

# Show help
pnpm address-enrichment sync --help
```

The sync command:

- Fetches top addresses from Anticapture API (delegates by voting power, holders by balance)
- Skips addresses already in the database (no re-fetching)
- Only calls Arkham API and RPC for new addresses
- Deduplicates addresses that appear in both lists

## Database Schema

The service uses a single table `address_enrichment` to permanently store enriched address data:

- `address` (PK): Ethereum address (42 chars)
- `is_contract`: Boolean indicating if address is a contract
- `arkham_entity`: Entity name from Arkham (e.g., "Upbit", "Binance")
- `arkham_entity_type`: Entity type from Arkham (e.g., "cex", "dex", "defi")
- `arkham_label`: Specific label from Arkham (e.g., "Cold Wallet", "Hot Wallet")
- `created_at`: Timestamp when data was first fetched

## Data Flow

1. Request comes in for `GET /address/0x123...`
2. Check if address exists in database
3. If found: return stored data immediately
4. If not found:
   - Call Arkham API for labels/entity/contract info
   - If Arkham doesn't have contract info, fall back to RPC `getCode`
   - Store in PostgreSQL (permanent)
   - Return enriched data
