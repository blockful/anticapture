# API Gateway Package Guide

## Overview

- **Service ID**: `api-gateway`
- **Port**: 4000
- **Stack**: GraphQL Mesh 0.100+, GraphQL 16.11
- **Purpose**: Unified GraphQL API aggregating multiple DAO API instances

## What It Does

- Aggregates multiple DAO-specific API instances into a single GraphQL endpoint
- Discovers API sources dynamically from `DAO_API_*` environment variables
- Converts OpenAPI specs from each API to GraphQL schemas
- Provides a unified query interface for the frontend
- Serves GraphQL Playground for development

## Commands

```bash
# Development
pnpm gateway dev                # Start gateway on :4000

# Testing
pnpm gateway test               # Run Jest unit tests

# Verification (run after every change)
pnpm gateway typecheck          # Type checking
pnpm gateway lint               # Lint checking
pnpm gateway lint:fix           # Auto-fix lint issues
```

## Dependencies

- **One or more API instances**: Running locally or on Railway
- Each API must expose an OpenAPI spec at `/docs`

## Environment Variables

Configure which DAO APIs to aggregate:

| Variable        | Required     | Example                  | Description             |
| --------------- | ------------ | ------------------------ | ----------------------- |
| `DAO_API_ENS`   | at least one | `http://localhost:42069` | URL of ENS API instance |
| `DAO_API_UNI`   | no           | `http://localhost:42070` | URL of UNI API instance |
| `DAO_API_<DAO>` | no           | —                        | Any supported DAO ID    |
| `PORT`          | no           | 4000                     | HTTP port               |

### Dynamic Source Discovery

The gateway automatically:

1. Scans environment for `DAO_API_*` variables
2. Fetches OpenAPI spec from each URL's `/docs` endpoint
3. Converts OpenAPI to GraphQL schema
4. Exposes unified schema with DAO-prefixed operations

## File Structure

```
apps/api-gateway/
├── src/
│   ├── index.ts              # Entry point & Mesh configuration
│   ├── resolvers/            # Custom GraphQL resolvers (if any)
│   └── config/               # Gateway configuration
├── tests/                    # Jest test files
├── .meshrc.yaml              # GraphQL Mesh configuration
└── jest.config.js            # Jest configuration
```

## How It Works

1. **Environment scanning**: Reads `DAO_API_*` variables
2. **Source registration**: Creates GraphQL Mesh sources for each API
3. **Schema stitching**: Combines all schemas into unified GraphQL schema
4. **Request routing**: Routes queries to appropriate backend API
5. **Response aggregation**: Combines results from multiple APIs

### Query Example

```graphql
query GetDAOData {
  ens {
    dao {
      name
      totalSupply
    }
  }
  uni {
    proposals {
      id
      title
      status
    }
  }
}
```

## Adding a New DAO

To add support for a new DAO:

1. Deploy a new API instance for the DAO
2. Add environment variable: `DAO_API_<DAOID>=<url>`
3. Restart the gateway
4. The new DAO will be automatically available

## Development Workflow

### Local Development

```bash
# Terminal 1: Start ENS API
pnpm api dev

# Terminal 2: Start gateway (will discover running APIs)
pnpm gateway dev

# Terminal 3: Test queries
curl http://localhost:4000/graphql
```

### Testing Against Railway

```bash
# Point to Railway-deployed APIs
export DAO_API_ENS=https://ens-api.railway.app
export DAO_API_UNI=https://uni-api.railway.app

pnpm gateway dev
```

## Testing Strategy

- **Integration tests**: Test gateway with mock API responses
- **Schema validation**: Ensure OpenAPI → GraphQL conversion works
- **Resolver tests**: Test custom resolvers (if any)

## Common Issues

### Gateway Won't Start

- **No APIs configured**: At least one `DAO_API_*` variable must be set
- **API unreachable**: Ensure API URLs are correct and accessible
- **OpenAPI fetch fails**: Check that `/docs` endpoint returns valid OpenAPI spec

### GraphQL Errors

- **Operation not found**: Check that operation exists in source API
- **Type mismatch**: OpenAPI schema may not match actual API response
- **Timeout**: API may be slow to respond, increase timeout config

## Custom Resolvers

If you need to add custom logic (e.g., combining data from multiple sources):

```typescript
// src/resolvers/custom.ts
export const resolvers = {
  Query: {
    combinedDAOData: async (root, args, context, info) => {
      const ensData = await context.ENS.Query.dao();
      const uniData = await context.UNI.Query.dao();

      return {
        ens: ensData,
        uni: uniData,
      };
    },
  },
};
```

## GraphQL Playground

When running locally, visit:

- `http://localhost:4000/graphql` - GraphQL Playground
- Explore schema, test queries, view documentation

## Related Documentation

- [GraphQL Mesh Documentation](https://the-guild.dev/graphql/mesh)
- Root `AGENTS.md` for general guidelines
- `apps/api/AGENTS.md` for source API documentation
- `packages/graphql-client/AGENTS.md` for client generation
