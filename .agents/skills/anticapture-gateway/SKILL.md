---
name: anticapture-gateway
description: Used whenever running the dashboard locally
---

# API Gateway Package Guide

## Overview

- **Service ID**: `api-gateway`
- **Port**: 4000
- **Stack**: GraphQL Mesh

## What It Does

- Aggregates multiple DAO-specific API instances into a single GraphQL endpoint
- Converts OpenAPI specs from each API to GraphQL schemas
- Provides a unified query interface for the frontend

## Dependencies

- **One or more API instances**: Running locally or on Railway
- Each API must expose an OpenAPI spec at `/docs`

## How It Works

1. **Environment scanning**: Reads `DAO_API_*` variables
2. **Source registration**: Creates GraphQL Mesh sources for each API
3. **Schema stitching**: Combines all schemas into unified GraphQL schema
4. **Request routing**: Routes queries to appropriate backend API relying on the `anticapture-dao-id`
5. **Response aggregation**: Combines results from multiple APIs

## Rules

- Every time a new endpoints is added or changed it should be added to `src/resolvers/rest.ts`
