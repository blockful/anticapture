---
name: anticapture-api
description: Used whenever creating or changing an endpoint on the API
---

# API Package Guide

## Overview

- **Service ID**: `<dao>-api`
- **Port**: 42069 (configurable via `PORT` env var)
- **Stack**: Hono, Drizzle ORM, @hono/zod-openapi
- **Purpose**: REST API serving governance data from the indexer with OpenAPI documentation

## What It Does

- Serves governance data indexed by both the Indexer and Offchain Indexer
- Exposes RESTful endpoints with OpenAPI/Swagger documentation (`/docs`)

## Dependencies

- **PostgreSQL**: With data populated by the Indexer
- **Ethereum RPC**: For some real-time queries

## Architecture

### Layer Responsibilities

- **Controllers**: Define routes, validate requests, handle responses
- **Services**: Implement business logic, orchestrate repositories and clients
- **Repositories**: Execute database queries using Drizzle ORM
- **Clients**: Interact with external APIs (CoinGecko, Dune, etc.)
- **Mappers**: Transform database models to API response DTOs

## Where to Put New Code

| What you're adding       | Where it goes                | Further information               |
| ------------------------ | ---------------------------- | --------------------------------- |
| API endpoints            | `src/controllers/<domain>/`  | `./references/new-endpoint.md`    |
| Business logic           | `src/services/<domain>/`     |                                   |
| Database query           | `src/repositories/<domain>/` |                                   |
| Data transformation      | `src/mappers/<domain>/`      |                                   |
| External API integration | `src/clients/<service>/`     |                                   |
| Database schema          | `src/database/schema/`       | `./references/database-schema.md` |

When testing an endpoint see `./references/testing-endpoint.md`.
