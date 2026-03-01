---
name: anticapture-dashboard
description: Used whenever dealing with the dashboard
---

# Dashboard Package Guide

## Overview

- **Port**: 3000
- **Stack**: Next.js, Tailwind CSS, React Query, wagmi, viem, Zustand, Recharts

## What It Does

- Multi-DAO support
- Governance security analysis and risk assessment
- Token distribution visualization

## Dependencies

- **API Gateway**: GraphQL endpoint for data fetching
- **GraphQL Client**: Generated types and hooks (`@anticapture/graphql-client`)

## Architecture

### Feature-Based Organization

The dashboard follows a **feature-based architecture** where each major domain has its own directory with all related code.

```
apps/dashboard/
├── app/                        # Next.js App Router pages
├── features/                   # Feature modules (domain-driven)
│   └── <feature-name>/
│       ├── components/         # Feature-specific components
│       ├── hooks/              # Feature-specific hooks
│       ├── contexts/           # Feature-specific React contexts
│       └── utils/              # Feature-specific utilities
├── shared/                     # Shared code across features
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── design-system/      # Design system components
│   ├── hooks/                  # Shared hooks
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── lib/                    # External library configurations
├── templates/                  # Page-level templates
├── widgets/                    # Standalone UI components
└── public/                     # Static assets
```

## Creating new components

- Every new component should be added to the design system with props and variants
