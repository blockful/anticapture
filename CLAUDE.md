# Anticapture Codebase Architecture

## Project Overview

**Anticapture** is a comprehensive DAO governance security platform built as a monorepo that provides data-driven analysis to help DAO communities identify, assess, and mitigate governance capture risks. The platform serves major DAOs including Uniswap, ENS, and Optimism.

## Overall Architecture

The project follows a **microservices architecture** organized as a **pnpm monorepo** with multiple independent applications that work together to provide a complete governance analysis platform.

### Key Architectural Patterns

- **Microservices**: Each application serves a specific purpose and can be deployed independently
- **Event-driven**: Real-time blockchain event indexing and processing
- **API Gateway Pattern**: Unified GraphQL endpoint that aggregates multiple data sources
- **Component-driven Frontend**: Feature-based organization with shared components
- **Type-safe**: Full TypeScript implementation across all applications

## Directory Structure

```md
anticapture/
├── apps/ # Main applications
│ ├── dashboard/ # Next.js frontend application
│ ├── api-gateway/ # GraphQL Mesh unified API
│ ├── indexer/ # Ponder blockchain event indexer
│ ├── graphql-client/ # Generated GraphQL client library
│ ├── indexer-metrics/ # Grafana/Prometheus monitoring
│ └── local-node/ # Local Ethereum development node
├── infra/ # Infrastructure and deployment configs
├── packages/ # Shared packages (if any)
└── [root config files]
```

## Technology Stack

### Frontend (Dashboard)

- **Framework**: Next.js 15.3.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.7
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Web3**: wagmi, viem, ethers, RainbowKit
- **State Management**: TanStack Query, SWR, React Context
- **Development**: Storybook, Jest, Vitest, Playwright
- **Data Fetching**: Apollo Client (GraphQL), Axios (REST)

### Backend Services

#### Indexer (Blockchain Data)

- **Framework**: Ponder (blockchain indexing framework)
- **Database**: PostgreSQL with Drizzle ORM
- **API**: Hono (REST), GraphQL
- **Blockchain**: viem for Ethereum interactions
- **Validation**: Zod schemas

#### API Gateway

- **Framework**: GraphQL Mesh
- **Purpose**: Unified GraphQL API aggregating multiple sources
- **Language**: TypeScript with Node.js

### Infrastructure & DevOps

- **Package Manager**: pnpm 10.10.0 (workspaces)
- **Build System**: Turbo (monorepo builds)
- **Containerization**: Docker & Docker Compose
- **Monitoring**: Grafana + Prometheus
- **Git Workflow**: Conventional Commits (commitlint)
- **Code Quality**: ESLint, Prettier, Husky

## Application Details

### 1. Dashboard (`/apps/dashboard`)

**Purpose**: React-based frontend providing DAO analytics and visualizations

**Key Features**:

- Multi-DAO support (Uniswap, ENS, Optimism)
- Governance security analysis and risk assessment
- Attack profitability calculations
- Token distribution visualization
- Community petition system integration
- Wallet connection (RainbowKit)

**Architecture**:

- **Feature-based organization**: Each major feature has its own directory with components, hooks, contexts, and utilities
- **Shared components**: Design system and reusable UI components
- **Template system**: Page templates that compose features
- **Widget system**: Higher-level components that don't belong to specific features

**Key Directories**:

- `features/`: Core business logic organized by domain
- `shared/`: Reusable components, hooks, types, and utilities
- `templates/`: Page-level templates
- `widgets/`: Standalone UI components

### 2. Indexer (`/apps/indexer`)

**Purpose**: Real-time blockchain event indexing using Ponder framework

**Responsibilities**:

- Monitor governance-related smart contracts
- Index proposals, votes, delegations, token transfers
- Provide both GraphQL and REST APIs
- Historical data aggregation
- Integration with external APIs (CoinGecko, Dune Analytics)

**Database Schema**:

- Account management and voting power tracking
- Proposal lifecycle management
- Vote and delegation recording
- Token transfer history
- Historical balance snapshots

### 3. API Gateway (`/apps/api-gateway`)

**Purpose**: Unified GraphQL API using GraphQL Mesh

**Functionality**:

- Aggregates multiple DAO-specific APIs
- Dynamic source configuration via environment variables
- Custom resolvers for request routing
- Single entry point for frontend applications

### 4. GraphQL Client (`/apps/graphql-client`)

**Purpose**: Auto-generated GraphQL client library

**Features**:

- TypeScript code generation from GraphQL schemas
- React Apollo hooks generation
- Shared across applications for type safety

## Development Workflow

### Package Management

- **pnpm workspaces**: Efficient dependency management
- **Turbo**: Optimized build and development tasks
- **Scripts**: Application-specific commands via workspace filters

### Key Commands

```bash
# Development
pnpm dashboard dev    # Frontend development server
pnpm indexer dev      # Blockchain indexer
pnpm gateway dev      # API Gateway

# Building
pnpm dashboard build  # Build specific application
turbo build          # Build all applications

# Infrastructure
docker-compose up -d  # Start PostgreSQL and local blockchain
```

### Code Organization Standards

- **Naming Conventions**:
  - Folders: kebab-case
  - Components: PascalCase
  - Functions: camelCase
- **Git**: Conventional Commits with commitlint
- **Type Safety**: Full TypeScript coverage
- **Testing**: Jest, Vitest, Playwright for different layers

## Configuration Files

### Root Level

- `package.json`: Workspace configuration and root scripts
- `pnpm-workspace.yaml`: Workspace package definitions
- `turbo.json`: Build system configuration
- `compose.yaml`: Docker services definition
- `commitlint.config.ts`: Git commit linting rules

### Application Level

- Each app has its own `package.json` with specific dependencies
- TypeScript configuration (`tsconfig.json`) per application
- Environment-specific configs (`.env` files)
- Build configs (Next.js, Vite, etc.)

## Deployment Architecture

### Docker Strategy

- Multi-stage builds for optimization
- Application-specific Dockerfiles
- Docker Compose for local development
- Production deployments via Railway (based on railway.toml files)

### Monitoring

- Grafana dashboards for metrics visualization
- Prometheus for metrics collection
- Health checks and observability built-in

## Development Philosophy

The codebase follows modern full-stack development practices with emphasis on:

- **Type Safety**: TypeScript throughout the stack
- **Developer Experience**: Hot reloading, code generation, comprehensive tooling
- **Scalability**: Microservices architecture allows independent scaling
- **Maintainability**: Clear separation of concerns and feature-based organization
- **Data Integrity**: Strong schemas and validation at API boundaries
- **Real-time Capabilities**: WebSocket support and real-time data updates

This architecture enables the team to build, maintain, and scale a complex DAO governance analysis platform while maintaining code quality and developer productivity.

## General instructions for Claude Code

- Always run `turbo lint` after making any code changes.

### MCP Tools

- **Context7 MCP**: Use to fetch updated documentation for libraries and frameworks like Next.js, Tailwind CSS, Shadcn.
- **Playwright MCP**: Use to check visual changes in the frontend with a real browser when UI modifications are made.
