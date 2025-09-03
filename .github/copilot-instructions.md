# Copilot Instructions for Anticapture

## Project Overview

Anticapture is a comprehensive DAO governance security platform built as a **pnpm monorepo** that provides data-driven analysis to help DAO communities identify, assess, and mitigate governance capture risks. The platform serves major DAOs including Uniswap, ENS, Optimism, and Arbitrum.

## Architecture

This is a **microservices architecture** with:

- **Frontend**: Next.js dashboard with TypeScript and Tailwind CSS
- **Backend**: Ponder blockchain indexer with PostgreSQL
- **API**: GraphQL Mesh gateway aggregating multiple data sources
- **Infrastructure**: Docker Compose for local development

## Repository Structure

```
anticapture/
├── apps/
│   ├── dashboard/         # Next.js frontend (port 3000)
│   ├── api-gateway/       # GraphQL Mesh API (port 4000)
│   ├── indexer/           # Ponder blockchain indexer (port 42069)
│   ├── graphql-client/    # Generated GraphQL client library
│   └── indexer-metrics/   # Grafana/Prometheus monitoring
├── infra/                 # Infrastructure and deployment
└── [config files]
```

## Key Technologies

### Frontend (Dashboard)

- **Next.js 15.3.2** with App Router
- **TypeScript 5** for type safety
- **Tailwind CSS 4.1.7** for styling
- **Radix UI** for components
- **wagmi, viem, RainbowKit** for Web3
- **Apollo Client** for GraphQL
- **Recharts** for data visualization

### Backend (Indexer)

- **Ponder** framework for blockchain indexing
- **PostgreSQL** with Drizzle ORM
- **GraphQL + REST APIs**
- **Zod** for validation

### Tools

- **pnpm workspaces** for package management
- **Turbo** for builds and tasks
- **ESLint, Prettier** for code quality
- **Husky** for git hooks
- **Docker Compose** for local development

## Development Commands

```bash
# Start infrastructure
docker-compose up -d

# Development servers
pnpm dashboard dev    # Frontend at http://localhost:3000
pnpm gateway dev      # API Gateway at http://localhost:4000
pnpm indexer dev      # Indexer at http://localhost:42069

# Building
pnpm dashboard build  # Build specific app
turbo build          # Build all apps

# Quality checks
turbo lint           # Lint all apps
pnpm lint:fix        # Fix linting issues
```

## Code Organization

### Dashboard (`/apps/dashboard`)

- `features/` - Business logic organized by domain
- `shared/` - Reusable components, hooks, types, utilities
- `templates/` - Page-level templates
- `widgets/` - Standalone UI components
- Feature-based organization with co-located components

### Indexer (`/apps/indexer`)

- `src/indexer/` - DAO-specific event handlers (UNI, ENS, OP, GTC)
- `src/eventHandlers/` - Shared event processing logic
- `ponder.schema.ts` - Database schema definitions
- Real-time blockchain event indexing

## Coding Standards

- **Naming**: kebab-case folders, PascalCase components, camelCase functions
- **TypeScript**: Full type safety required
- **Commits**: Use conventional commits (enforced by commitlint)
- **Testing**: Jest, Vitest, Playwright for different layers
- **Linting**: Always run `turbo lint` after changes

## Common Tasks

### Adding New DAO Support

1. Create indexer in `apps/indexer/src/indexer/{dao}/`
2. Define event handlers for governance events
3. Update GraphQL schema if needed
4. Add frontend components in `apps/dashboard/features/`

### GraphQL Schema Changes

1. Update `apps/indexer/ponder.schema.ts` for database
2. Update `apps/api-gateway/schema.graphql` for API
3. Regenerate client: `pnpm client generate`
4. Handle nullable fields properly (avoid "non-nullable" errors)

### Frontend Development

- Use existing design system components from `shared/`
- Follow feature-based organization
- Use Apollo Client for GraphQL queries
- Implement responsive design with Tailwind

## Testing

- Run existing tests: `turbo test`
- Frontend: Jest + Vitest + Playwright
- Backend: Unit tests for event handlers
- Integration: Test GraphQL queries end-to-end

## Deployment

- Uses Docker for containerization
- Railway for production deployment
- Each app has independent Dockerfile
- Environment configs in `.env` files

## Important Notes

- Always handle nullable GraphQL fields properly
- Use defensive programming for blockchain data (events can have missing fields)
- Test with real DAO data when making governance-related changes
- Follow the existing patterns for DAO indexers
- Validate changes with `turbo lint` before committing

## Environment Setup

1. Node.js 18.14+
2. pnpm 10.10.0+
3. Docker & Docker Compose
4. Clone repo and run `pnpm install`
5. Start with `docker-compose up -d` then dev servers

This platform helps DAOs monitor governance security, detect capture risks, and maintain decentralized decision-making.
