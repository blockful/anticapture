---
id: getting-started
title: Getting started
sidebar_position: 2
hide_table_of_contents: true
---

# Getting started

The Anticapture REST API serves DAO governance analytics over HTTPS with JSON
responses. This page covers everything you need for a first request.

## Base URL

```
https://gateful.up.railway.app
```

The interactive OpenAPI spec is served at
[`/docs/json`](https://gateful.up.railway.app/docs/json) — the same spec this
documentation is generated from.

## Authentication

All endpoints require a bearer token (contact the Anticapture team for an API
key):

```
Authorization: Bearer <your-anticapture-token>
```

## DAO scoping

Most endpoints are scoped to a single DAO via a **path parameter** — lowercase
identifiers such as `ens`, `uni`, or `arb`:

```
GET /{dao}/proposals
GET /{dao}/treasury/total
GET /{dao}/accounts/{address}/delegations
```

List the supported DAOs (and their identifiers) with
[`GET /daos`](/api-reference/daos).

## Your first request

Fetch the three most recent ENS proposals:

```bash
curl -H "Authorization: Bearer $ANTICAPTURE_TOKEN" \
  "https://gateful.up.railway.app/ens/proposals?limit=3&orderDirection=desc"
```

## Pagination

List endpoints paginate with `skip` and `limit` query parameters:

```bash
# Second page of 20 proposals
curl -H "Authorization: Bearer $ANTICAPTURE_TOKEN" \
  "https://gateful.up.railway.app/ens/proposals?skip=20&limit=20"
```

Each endpoint's reference page documents its exact parameters, defaults, and
maximums.

## Conventions

- **Token amounts** are returned as raw values in the token's native decimals
  (18 for most governance tokens) — divide accordingly for display.
- **Addresses** are hex-encoded Ethereum addresses.
- **Timestamps** are Unix epoch values unless a field says otherwise.

## Where to go next

- **[API Reference](/api-reference/anticapture-rest-api)** — every endpoint,
  generated from the live OpenAPI spec.
- **[MCP server](./mcp/index.md)** — query the same API from LLM agents in
  natural language.
- **[Webhooks](./webhooks/index.md)** — push notifications instead of polling.
