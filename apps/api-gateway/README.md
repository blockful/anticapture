# API Gateway

The API Gateway serves as a unified entry point for accessing various services in the Anticapture ecosystem.
It uses GraphQL Mesh to combine multiple data sources into a single, cohesive GraphQL API.

## Features

- **Unified API**: Combines multiple backend services into a single GraphQL endpoint
- **Dynamic Source Configuration**: Automatically configures sources based on environment variables
- **Custom Resolvers**: Extends the schema with custom resolvers to work more as a router forwarding the request based on the query being made

## Configuration

The gateway is configured through environment variables:

- `DAO_API_*`:
  - URLs for DAO-specific APIs (e.g., `DAO_API_OP=https://api.optimism.dao`)
  - This is based on the `indexer` package which exposes both a graphql API at the root level, and a rest API on the `/docs` path
- `PETITION_API_URL`: URL for the Petition REST API service

## Architecture

The API Gateway:

1. Dynamically loads API sources from environment variables
2. Creates both GraphQL and REST handlers for each DAO API
3. Merges all sources into a unified GraphQL schema
4. All the available request had to be mapped in order to make the gateway to work as a router, instead of the usual schema aggregator proposed by the GraphQL Mesh team
   a. `rest`, `item`, and `list` are the requests gathered by type

## Development

To run the API Gateway locally:

1. fill the `apps/api-gateway/.env`
2. run `pnpm run gateway dev` at the root level
