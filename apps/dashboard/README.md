This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy Anticapture on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

Folder structure:

```
src/
  ├── features/
  │   ├── index.tsx
  │   ├── governance-activity/
  │   ├── token-distribution/
  │   │   ├── utils/
  │   │       ├── http-client/
  │   ├── dao-info/
  │   ├── attack-profitability/
  │   ├── show-support/
  │   │   ├── index.tsx <-- exports ShowSupport.tsx and ShowSupportStickyBar.tsx
  │   │   ├── ShowSupport.tsx
  │   │   ├── components/
  │   │   │   └── ShowSupportStickyBar.tsx
  │   │   ├── hooks/
  │   │   ├── utils/
  │   │   ├── types/
  │   │   └── test/ -- Test folder inside feature
  │   └── governance-implementation/
  │       ├── GovernanceImplementation.tsx
  │       ├── components/
  │       │   └── GovernanceImplementationSideBarButton.tsx  <-- export <SidebarButton title="Governance Implementation" icon anchorId>
  │       ├── hooks/
  │       ├── utils/
  │       └── test/
  ├── templates/ <-- Page templates, imports features
  │   ├── dao/
  │   └── home/
  ├── widgets/ <-- Components that are not a feature nor used by features or shared, widgets can also aggregate components of features
  │   └── sidebar/
  |       └──components/
  ├── shared/ <-- Components that are used by features
  │   ├── components/
  │   │   ├── shadcn/
  │   │   ├── ConnectCustom.tsx <-- Needs further discussion
  │   │   ├── buttons/
  │   │   │   └── SidebarButton.tsx
  │   │   └── icons/
  │   ├── contexts/
  │   ├── hooks/
  │   ├── client/
  │   ├── types/ -- Types: Interfaces, Enums, etc.
  │   │   └── dao.ts
  │   └── utils/ -- Utilitary and Constants
  │       └── dao-config/
  ├── public/
  └── app/
      ├── layout/
      └── routing/
```

# Frontend Architecture Analysis: Folder Structure Approaches

## Current Situation

- Team experiencing difficulties with Atomic Design implementation
- Complexity in folder organization
- Need for a more maintainable and scalable structure

## Analysis of Different Approaches

### 1. Feature-Sliced Design

```
src/
  ├── features/
  │   ├── index.tsx
  │   ├── governance-activity/
  │   ├── token-distribution/
  │   │   ├── utils/
  │   │       ├── http-client/
  │   ├── dao-info/
  │   ├── attack-profitability/
  │   ├── show-support/
  │   │   ├── index.tsx <-- exports ShowSupport.tsx and ShowSupportStickyBar.tsx
  │   │   ├── ShowSupport.tsx
  │   │   ├── components/
  │   │   │   └── ShowSupportStickyBar.tsx
  │   │   ├── hooks/
  │   │   ├── utils/
  │   │   ├── types/
  │   │   └── test/ -- Test folder inside feature
  │   └── governance-implementation/
  │       ├── GovernanceImplementation.tsx
  │       ├── components/
  │       │   └── GovernanceImplementationSideBarButton.tsx  <-- export <SidebarButton title="Governance Implementation" icon anchorId>
  │       ├── hooks/
  │       ├── utils/
  │       └── test/
  ├── templates/ <-- Page templates, imports features
  │   ├── dao/
  │   └── home/
  ├── widgets/ <-- Components that are not a feature nor used by features or shared, widgets can also aggregate components of features
  │   └── sidebar/
  |       └──components/
  ├── shared/ <-- Components that are used by features
  │   ├── components/
  │   │   ├── shadcn/
  │   │   ├── ConnectCustom.tsx <-- Needs further discussion
  │   │   ├── buttons/
  │   │   │   └── SidebarButton.tsx
  │   │   └── icons/
  │   ├── contexts/
  │   ├── hooks/
  │   ├── client/
  │   ├── types/ -- Types: Interfaces, Enums, etc.
  │   │   └── dao.ts
  │   └── utils/ -- Utilitary and Constants
  │   │   └── dao-config/
  ├── public/
  └── app/
      ├── layout/
      └── routing/
```

**Pros:**

- Business domain focused
- Easier to locate related code
- Self-contained modules
- Better for large teams working on different features
- Clear separation of concerns
- Easier to maintain and scale

**Cons:**

- Potential for duplicate components
- Requires good communication about shared components
- Initial setup might be more complex

### 2. Layer-Based Organization

```
src/
  ├── presentation/
  │   ├── components/
  │   ├── pages/
  │   └── layouts/
  ├── domain/
  │   ├── entities/
  │   ├── use-cases/
  │   └── services/
  └── infrastructure/
      ├── api/
      ├── storage/
      └── utils/
```

**Pros:**

- Clear separation of concerns
- Follows clean architecture principles
- Easy to test each layer independently
- Good for complex business logic

**Cons:**

- Might be overkill for simple applications
- Requires more boilerplate
- Steeper learning curve

### 3. Module-Based Organization

```
src/
  ├── modules/
  │   ├── auth/
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   └── services/
  │   └── dashboard/
  │       ├── components/
  │       ├── hooks/
  │       └── services/
  └── shared/
      ├── components/
      ├── hooks/
      └── utils/
```

**Pros:**

- Self-contained modules
- Easy to understand module boundaries
- Good for micro-frontends
- Clear ownership of code

**Cons:**

- Potential for duplicate code
- Requires careful planning of shared resources
- Might lead to larger bundle sizes

### 4. Route-Based Organization

```
src/
  ├── routes/
  │   ├── login/
  │   ├── dashboard/
  │   └── settings/
  ├── components/
  │   ├── common/
  │   └── shared/
  └── services/
      ├── api/
      └── utils/
```

**Pros:**

- Easy to understand URL structure
- Clear page boundaries
- Good for SEO-focused applications
- Simple to maintain

**Cons:**

- Might lead to duplicate components
- Less flexible for complex features
- Can become messy with nested routes

## Recommendation

Based on the analysis, for a dashboard application, I recommend the **Feature-Based Organization** approach because:

1. It aligns well with business domains
2. Makes it easier for teams to work on specific features
3. Provides clear boundaries between different parts of the application
4. Scales well as the application grows
5. Easier to maintain and refactor

## Implementation Strategy

1. Start with a clear feature identification
2. Create a shared components library
3. Implement feature-based routing
4. Establish clear guidelines for component sharing
5. Document the new structure thoroughly

## Migration Steps

1. Identify core features in the current application
2. Create the new folder structure
3. Move components gradually, feature by feature
4. Update imports and references
5. Test thoroughly after each migration
6. Document the new structure and guidelines

## Best Practices

1. Keep components small and focused
2. Use clear naming conventions
3. Document shared components well
4. Implement proper testing strategies
5. Use TypeScript for better type safety
6. Maintain consistent file naming

## Specific Implementation for Dashboard Application

### Proposed Structure Based on Current Components

```
apps/dashboard/
├── src/
│   ├── features/
│   │   ├── dao/
│   │   │   ├── components/
│   │   │   │   ├── dao-info/
│   │   │   │   │   ├── DaoInfoSection.tsx
│   │   │   │   │   ├── CardDaoSignature.tsx
│   │   │   │   │   ├── BaseCardDaoInfo.tsx
│   │   │   │   │   ├── DaoInfoDropdown.tsx
│   │   │   │   │   ├── CountdownDaoInfo.tsx
│   │   │   │   │   ├── TextCardDaoInfoItem.tsx
│   │   │   │   │   ├── SwitchCardDaoInfoItem.tsx
│   │   │   │   │   ├── BadgeCardDaoInfoItem.tsx
│   │   │   │   │   └── ButtonCardDaoInfoItem.tsx
│   │   │   │   ├── governance-implementation/
│   │   │   │   │   ├── GovernanceImplementationSection.tsx
│   │   │   │   │   ├── GovernanceImplementationCard.tsx
│   │   │   │   │   ├── QuorumCard.tsx
│   │   │   │   │   ├── TimelockCard.tsx
│   │   │   │   │   └── VoteCard.tsx
│   │   │   │   ├── governance-activity/
│   │   │   │   │   ├── GovernanceActivitySection.tsx
│   │   │   │   │   └── GovernanceActivityTable.tsx
│   │   │   │   ├── support-dao/
│   │   │   │   │   ├── SupportDaosSection.tsx
│   │   │   │   │   ├── SupportDaoCard.tsx
│   │   │   │   │   ├── ShowSupportSection.tsx
│   │   │   │   │   ├── SupportersCarroussel.tsx
│   │   │   │   │   └── ReachOutToUsCard.tsx
│   │   │   │   └── security-council/
│   │   │   │       ├── SecurityCouncilCard.tsx
│   │   │   │       └── ContractsCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useDaoData.ts
│   │   │   └── types/
│   │   │       └── dao.types.ts
│   │   ├── token/
│   │   │   ├── components/
│   │   │   │   ├── token-distribution/
│   │   │   │   │   ├── TokenDistributionSection.tsx
│   │   │   │   │   ├── TokenDistributionTable.tsx
│   │   │   │   │   ├── TokenDistributionCustomTooltip.tsx
│   │   │   │   │   └── MultilineChartTokenDistribution.tsx
│   │   │   │   └── attack-cost/
│   │   │   │       ├── AttackCostBarChart.tsx
│   │   │   │       └── AttackProfitabilitySection.tsx
│   │   │   └── hooks/
│   │   │       └── useTokenData.ts
│   │   ├── security/
│   │   │   ├── components/
│   │   │   │   ├── risk-level/
│   │   │   │   │   ├── RiskLevelCard.tsx
│   │   │   │   │   └── BadgeInAnalysis.tsx
│   │   │   │   └── extractable-value/
│   │   │   │       ├── ExtractableValueAccordion.tsx
│   │   │   │       ├── ExtractableValueCustomTooltip.tsx
│   │   │   │       └── ExtractableValueToggleHeader.tsx
│   │   │   └── hooks/
│   │   │       └── useSecurityMetrics.ts
│   │   └── dashboard/
│   │       ├── components/
│   │       │   ├── home/
│   │       │   │   ├── HomeDashboardSection.tsx
│   │       │   │   └── DashboardTable.tsx
│   │       │   └── layout/
│   │       │       ├── HeaderSidebar.tsx
│   │       │       ├── HeaderMobile.tsx
│   │       │       ├── HeaderDAOSidebar.tsx
│   │       │       ├── HeaderDAOSidebarDropdown.tsx
│   │       │       ├── ButtonHeaderDAOSidebar.tsx
│   │       │       └── ButtonHeaderDAOSidebarMobile.tsx
│   │       └── hooks/
│   │           └── useDashboard.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   └── chart.tsx
│   │   │   ├── data/
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── delegates-table.tsx
│   │   │   │   └── holders-table.tsx
│   │   │   └── feedback/
│   │   │       ├── Skeleton.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       └── Badge.tsx
│   │   ├── hooks/
│   │   │   └── useLocalStorage.ts
│   │   └── utils/
│   │       └── helpers.ts
│   ├── templates/
│   │   ├── DaoTemplate.tsx
│   │   └── HomeTemplate.tsx
│   └── providers/
│       └── web3/
│           └── ConnectWallet.tsx
├── tests/
│   ├── features/
│   │   ├── dao/
│   │   │   ├── dao-info/
│   │   │   ├── governance-implementation/
│   │   │   ├── governance-activity/
│   │   │   ├── support-dao/
│   │   │   └── security-council/
│   │   ├── token/
│   │   │   ├── token-distribution/
│   │   │   └── attack-cost/
│   │   ├── security/
│   │   │   ├── risk-level/
│   │   │   └── extractable-value/
│   │   └── dashboard/
│   │       ├── home/
│   │       └── layout/
│   └── shared/
└── public/
```

### Key Changes in Section-Based Organization

1. **DAO Feature Sections**

   - `dao-info`: All components related to DAO information display
   - `governance-implementation`: Components for governance implementation
   - `governance-activity`: Components for governance activity tracking
   - `support-dao`: Components for DAO support features
   - `security-council`: Components for security council features

2. **Token Feature Sections**

   - `token-distribution`: Components for token distribution visualization
   - `attack-cost`: Components for attack cost analysis

3. **Security Feature Sections**

   - `risk-level`: Components for risk level assessment
   - `extractable-value`: Components for extractable value analysis

4. **Dashboard Feature Sections**
   - `home`: Main dashboard components
   - `layout`: All layout-related components

### Benefits of Section-Based Organization

1. **Clear Component Relationships**

   - Components are grouped by their specific use case
   - Easier to understand which components work together
   - Clear boundaries between different sections

2. **Better Maintainability**

   - Changes to a section can be made in isolation
   - Easier to find related components
   - Clear ownership of components

3. **Improved Developer Experience**

   - Intuitive organization based on component usage
   - Easier to understand component relationships
   - Clear separation of concerns

4. **Easier Testing**
   - Tests can be organized by section
   - Clear testing boundaries
   - Easier to maintain test coverage

## Conclusion

The Feature-Based Organization provides the best balance between maintainability, scalability, and developer experience for a dashboard application. It allows for clear separation of concerns while keeping related code together, making it easier for teams to work on specific features without stepping on each other's toes.

kebab for folders
pascal for components
camel for functions
