# Anticapture

> A comprehensive DAO governance security platform for analyzing and preventing governance capture risks

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.3.1-blue.svg)](package.json)

## Overview

Anticapture is a data-driven platform that helps DAO communities identify, assess, and mitigate governance capture risks. The platform provides comprehensive security analysis, attack profitability assessments, and real-time governance monitoring for major DAOs including Uniswap, ENS, and Optimism.

## Key Features

- **🛡️ Governance Security Analysis** - Multi-dimensional risk assessment and vulnerability monitoring
- **📊 Attack Profitability Assessment** - Economic feasibility analysis of potential governance attacks
- **🗳️ Governance Activity Tracking** - Proposal lifecycle and voting participation monitoring
- **🪙 Token Distribution Analysis** - Voting power concentration and decentralization metrics
- **📈 Resilience Assessment** - DAO maturity and security milestone tracking
- **✍️ Community Petition System** - Governance improvement proposal collection
  implement using Snapshot

## Applications

| Application                              | Description                                              | Technology                    |
| ---------------------------------------- | -------------------------------------------------------- | ----------------------------- |
| [**Dashboard**](./apps/dashboard)        | Frontend interface with DAO analytics and visualizations | Next.js, TypeScript, Tailwind |
| [**API Gateway**](./apps/api-gateway)    | Unified GraphQL API aggregating multiple data sources    | GraphQL Mesh                  |
| [**Indexer**](./apps/indexer)            | Blockchain event indexer for real-time governance data   | Ponder, PostgreSQL            |
| [**Monitoring**](./apps/indexer-metrics) | Performance monitoring and metrics                       | Grafana, Prometheus           |

## Quick Start

### Prerequisites

- Node.js 18.14+
- pnpm 10.10.0+
- Docker & Docker Compose

### Installation

```bash
# Clone and install
git clone https://github.com/blockful-io/anticapture.git
cd anticapture
pnpm install

# Start infrastructure
docker-compose up -d

# Run development environment
pnpm dashboard dev    # Frontend at http://localhost:3000
pnpm gateway dev      # API Gateway at http://localhost:4000
pnpm indexer dev      # Indexer API at http://localhost:42069
```

## Development

This monorepo uses pnpm workspaces and Turbo for efficient development and builds.

```bash
# Application-specific commands
pnpm <app-name> <command>

# Examples
pnpm dashboard build
pnpm indexer start
pnpm gateway test
```

See individual application READMEs for detailed setup and development instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Make your changes following existing code conventions
4. Test your changes
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Built by [Blockful](https://blockful.io)
