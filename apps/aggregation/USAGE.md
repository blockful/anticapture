# Usage Examples

## Quick Start

1. **Setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and configure your DAO API URLs:

```bash
DAO_API_UNISWAP=https://uniswap-api.example.com
DAO_API_ENS=https://ens-api.example.com
DAO_API_OPTIMISM=https://optimism-api.example.com
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Start development server:**

```bash
# From the aggregation directory
pnpm dev

# Or from the monorepo root
pnpm aggregation dev
```

The server will start on `http://localhost:3000`

## API Usage Examples

### 1. Health Check

Check if the server is running and verify health of all configured APIs:

```bash
curl http://localhost:3000/health
```

Response (when all APIs are healthy):

```json
{
  "status": "ok",
  "timestamp": "2025-12-11T16:30:00.000Z",
  "uptime": 45.123,
  "environment": "development",
  "configuredApis": 3,
  "apis": {
    "timestamp": "2025-12-11T16:30:00.000Z",
    "totalApis": 3,
    "successCount": 3,
    "failureCount": 0,
    "totalResponseTime": 345,
    "responses": [
      {
        "url": "https://api1.example.com/health",
        "success": true,
        "data": { "status": "healthy" },
        "statusCode": 200,
        "responseTime": 112
      },
      {
        "url": "https://api2.example.com/health",
        "success": true,
        "data": { "ok": true },
        "statusCode": 200,
        "responseTime": 98
      },
      {
        "url": "https://api3.example.com/health",
        "success": true,
        "data": { "status": "ok" },
        "statusCode": 200,
        "responseTime": 135
      }
    ]
  }
}
```

Response (when one or more APIs are unhealthy):

```json
{
  "status": "degraded",
  "timestamp": "2025-12-11T16:30:00.000Z",
  "uptime": 45.123,
  "environment": "development",
  "configuredApis": 3,
  "apis": {
    "timestamp": "2025-12-11T16:30:00.000Z",
    "totalApis": 3,
    "successCount": 2,
    "failureCount": 1,
    "totalResponseTime": 30456,
    "responses": [
      {
        "url": "https://api1.example.com/health",
        "success": true,
        "data": { "status": "healthy" },
        "statusCode": 200,
        "responseTime": 112
      },
      {
        "url": "https://api2.example.com/health",
        "success": true,
        "data": { "ok": true },
        "statusCode": 200,
        "responseTime": 98
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

**The health check endpoint:**

- Calls `/health` on each configured API
- Returns `"ok"` status if all APIs are healthy
- Returns `"degraded"` status if any API fails
- Includes detailed health information from each API
- Perfect for load balancer health checks and monitoring

### 2. View Configured APIs

```bash
curl http://localhost:3000/api/urls
```

Response:

```json
{
  "urls": ["https://api1.example.com", "https://api2.example.com", "https://api3.example.com"],
  "count": 3
}
```

### 3. Aggregate Root Endpoints

Fetch and aggregate data from all configured API root endpoints:

```bash
curl http://localhost:3000/api/aggregate
```

Response:

```json
{
  "timestamp": "2025-12-11T16:30:00.000Z",
  "totalApis": 3,
  "successCount": 2,
  "failureCount": 1,
  "totalResponseTime": 456,
  "responses": [
    {
      "url": "https://api1.example.com",
      "success": true,
      "data": {
        "version": "1.0.0",
        "status": "active"
      },
      "statusCode": 200,
      "responseTime": 123
    },
    {
      "url": "https://api2.example.com",
      "success": true,
      "data": {
        "service": "api2",
        "healthy": true
      },
      "statusCode": 200,
      "responseTime": 234
    },
    {
      "url": "https://api3.example.com",
      "success": false,
      "error": "connect ETIMEDOUT",
      "responseTime": 30000
    }
  ]
}
```

### 4. Aggregate with Dynamic Path

Append a path to all API URLs and aggregate responses:

```bash
# Get /users from all APIs
curl http://localhost:3000/api/aggregate/users

# Get /api/v1/products from all APIs
curl http://localhost:3000/api/aggregate/api/v1/products

# Get /users/123/profile from all APIs
curl http://localhost:3000/api/aggregate/users/123/profile
```

Example response for `/api/aggregate/users`:

```json
{
  "timestamp": "2025-12-11T16:30:00.000Z",
  "totalApis": 3,
  "successCount": 3,
  "failureCount": 0,
  "totalResponseTime": 678,
  "responses": [
    {
      "url": "https://api1.example.com/users",
      "success": true,
      "data": [
        { "id": 1, "name": "Alice" },
        { "id": 2, "name": "Bob" }
      ],
      "statusCode": 200,
      "responseTime": 156
    },
    {
      "url": "https://api2.example.com/users",
      "success": true,
      "data": [{ "id": 10, "name": "Charlie" }],
      "statusCode": 200,
      "responseTime": 234
    },
    {
      "url": "https://api3.example.com/users",
      "success": true,
      "data": [],
      "statusCode": 200,
      "responseTime": 288
    }
  ]
}
```

### 5. Use Query Parameter

Alternative way to specify the path using a query parameter:

```bash
curl "http://localhost:3000/api/proxy?path=/users"
curl "http://localhost:3000/api/proxy?path=/api/v1/products"
```

## Real-World Use Cases

### Use Case 1: DAO Governance Data Aggregation

Configure multiple DAO indexer APIs:

```bash
API_URL_1=https://uniswap-indexer.example.com
API_URL_2=https://ens-indexer.example.com
API_URL_3=https://optimism-indexer.example.com
```

Aggregate proposal data across all DAOs:

```bash
curl http://localhost:3000/api/aggregate/proposals
```

### Use Case 2: Multi-Region API Aggregation

Configure the same API across different regions:

```bash
API_URL_1=https://api-us-east.example.com
API_URL_2=https://api-eu-west.example.com
API_URL_3=https://api-asia.example.com
```

Check which region is responding fastest:

```bash
curl http://localhost:3000/api/aggregate/status
```

The `responseTime` field in each response shows the latency.

### Use Case 3: Microservices Aggregation

Aggregate data from different microservices:

```bash
API_URL_1=https://user-service.internal
API_URL_2=https://product-service.internal
API_URL_3=https://order-service.internal
API_URL_4=https://analytics-service.internal
```

Get health status from all services:

```bash
curl http://localhost:3000/api/aggregate/health
```

## Error Handling

The BFF gracefully handles errors from individual APIs:

- **Network errors**: Returns error message and partial results from successful APIs
- **Timeouts**: Configurable via `REQUEST_TIMEOUT` env var
- **4xx/5xx errors**: Returns status code and any error details
- **Partial failures**: Continues aggregating even if some APIs fail

Example with mixed success/failure:

```json
{
  "timestamp": "2025-12-11T16:30:00.000Z",
  "totalApis": 3,
  "successCount": 1,
  "failureCount": 2,
  "totalResponseTime": 31456,
  "responses": [
    {
      "url": "https://api1.example.com/data",
      "success": true,
      "data": { "result": "ok" },
      "statusCode": 200,
      "responseTime": 123
    },
    {
      "url": "https://api2.example.com/data",
      "success": false,
      "error": "Request failed with status code 500",
      "statusCode": 500,
      "responseTime": 333
    },
    {
      "url": "https://api3.example.com/data",
      "success": false,
      "error": "timeout of 30000ms exceeded",
      "responseTime": 30000
    }
  ]
}
```

## Production Deployment

### Using Docker

```bash
# Build
docker build -t anticapture-aggregation .

# Run
docker run -d \
  -p 3000:3000 \
  -e API_URL_1=https://api1.example.com \
  -e API_URL_2=https://api2.example.com \
  -e NODE_ENV=production \
  --name aggregation \
  anticapture-aggregation
```

### Using Node.js

```bash
# Build
pnpm build

# Set environment variables
export NODE_ENV=production
export PORT=3000
export API_URL_1=https://api1.example.com
export API_URL_2=https://api2.example.com

# Start
pnpm start
```

## Configuration Reference

| Variable            | Type   | Default       | Description                                                                                                                                         |
| ------------------- | ------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`          | string | `development` | Environment mode                                                                                                                                    |
| `PORT`              | number | `3000`        | Server port                                                                                                                                         |
| `HOST`              | string | `0.0.0.0`     | Server host                                                                                                                                         |
| `DAO_API_*`         | string | -             | DAO API endpoints (e.g., `DAO_API_UNISWAP`, `DAO_API_ENS`). At least one required. All env vars matching this pattern are automatically discovered. |
| `REQUEST_TIMEOUT`   | number | `30000`       | Request timeout in milliseconds                                                                                                                     |
| `RATE_LIMIT_MAX`    | number | `100`         | Max requests per window                                                                                                                             |
| `RATE_LIMIT_WINDOW` | number | `60000`       | Rate limit window in milliseconds                                                                                                                   |
| `CORS_ORIGIN`       | string | `*`           | CORS allowed origins (comma-separated)                                                                                                              |

## Monitoring

View real-time logs in development:

```bash
pnpm dev
```

Logs include:

- Request/response details
- Response times
- Error messages
- Aggregation statistics

Production logs are in JSON format for easy parsing.
