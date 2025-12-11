# Anticapture API Aggregation BFF

A Backend for Frontend (BFF) service built with Fastify that aggregates responses from multiple REST APIs in parallel.

## Project Structure

```
apps/aggregation/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment validation with Zod
│   ├── routes/
│   │   ├── index.ts            # Route exports (barrel file)
│   │   └── health.ts           # Health check endpoint
│   ├── services/
│   │   └── aggregator.ts       # Core aggregation logic
│   └── index.ts                # Fastify server setup
├── package.json
├── tsconfig.json
├── Dockerfile
└── ...
```

## Features

- **Health Monitoring**: Aggregates health checks from all configured DAO APIs
- **Dynamic Configuration**: Automatically discovers all `DAO_API_*` environment variables - add unlimited DAO endpoints
- **Type-Safe**: Full TypeScript implementation with Zod v4 validation
- **Production-Ready**: Includes CORS, security headers, and comprehensive health checks
- **Error Handling**: Graceful error handling with detailed response metadata
- **Docker Support**: Multi-stage Docker build for optimized production deployments

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server status and health of all configured APIs by calling their `/health` endpoints.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-11T16:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "configuredApis": 3,
  "apis": {
    "timestamp": "2025-12-11T16:00:00.000Z",
    "totalApis": 3,
    "successCount": 2,
    "failureCount": 1,
    "totalResponseTime": 456,
    "responses": [
      {
        "url": "https://api.example.com/health",
        "success": true,
        "data": { "status": "ok" },
        "statusCode": 200,
        "responseTime": 123
      },
      {
        "url": "https://api2.example.com/health",
        "success": true,
        "data": { "healthy": true },
        "statusCode": 200,
        "responseTime": 234
      },
      {
        "url": "https://api3.example.com/health",
        "success": false,
        "error": "connect ETIMEDOUT",
        "responseTime": 30000
      }
    ]
  }
}
```

**Status values:**

- `"ok"` - All APIs are healthy
- `"degraded"` - One or more APIs failed health check

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# DAO API URLs - automatically discovered using DAO_API_* pattern
# Add as many DAO endpoints as needed
DAO_API_UNISWAP=https://uniswap-api.example.com
DAO_API_ENS=https://ens-api.example.com
DAO_API_OPTIMISM=https://optimism-api.example.com

# Request timeout in milliseconds
REQUEST_TIMEOUT=30000

# CORS
CORS_ORIGIN=*
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t anticapture-aggregation .

# Run container
docker run -p 3000:3000 --env-file .env anticapture-aggregation
```

## Architecture

### Parallel Processing

The BFF uses `Promise.allSettled()` to call all APIs in parallel, ensuring:

- Maximum performance through concurrent requests
- Resilience - one API failure doesn't block others
- Complete response data with success/failure status for each API

### Error Handling

Each API call is wrapped in try-catch with detailed error reporting:

- Network errors
- Timeout errors
- HTTP errors (4xx, 5xx)
- Response time tracking

### Type Safety

- Zod schemas validate environment variables at startup
- Full TypeScript coverage with strict mode
- Type-safe API responses and error handling

## Monitoring

The service includes:

- Structured JSON logging (Pino)
- Health check endpoint for load balancers
- Response time tracking per API
- Success/failure statistics

## Security

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin access
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Zod schema validation
- **Non-root Docker user**: Container security best practice
