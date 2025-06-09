# GraphQL Client Package

## Step-by-Step Guide: Creating and Using a New Query

### 1. Create the GraphQL Query File

Create a new `.graphql` file in the `documents/` directory:

```bash
# Example: Create a new query for getting proposal data
touch documents/getProposalData.graphql
```

### 2. Write Your GraphQL Query

Add your query to the `.graphql` file:

```graphql
# documents/getProposalData.graphql
query GetProposalData($proposalId: String!, $daoId: String!) {
  proposalsOnchain(where: { id: $proposalId, daoId: $daoId }) {
    items {
      id
      description
      status
      forVotes
      againstVotes
      abstainVotes
      proposerAccountId
      timestamp
    }
  }
}
```

### 3. Generate Types and Hooks

Run the code generation to create TypeScript types and React hooks:

```bash
npm run codegen
```

This will update both `types.ts` and `generated.ts` files with your new query.

### 4. Use in Your Application

#### For Non-React Apps (Types Only):

```typescript
import {
  GetProposalDataQuery,
  GetProposalDataQueryVariables,
  GetProposalDataDocument,
} from "@anticapture/graphql-client";

// With any GraphQL client (Apollo, urql, etc.)
const variables: GetProposalDataQueryVariables = {
  proposalId: "123",
  daoId: "UNI",
};

const result: GetProposalDataQuery = await client.query({
  query: GetProposalDataDocument,
  variables,
});
```

#### For React Apps (With Hooks):

```typescript
import { useGetProposalDataQuery } from '@anticapture/graphql-client/hooks';

function ProposalComponent() {
  const { data, loading, error } = useGetProposalDataQuery({
    variables: {
      proposalId: '123',
      daoId: 'UNI'
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.proposalsOnchain.items[0]?.description}</h1>
      <p>Status: {data?.proposalsOnchain.items[0]?.status}</p>
    </div>
  );
}
```

### 5. Development Workflow

For active development, use watch mode:

```bash
npm run dev
# or
npm run codegen:watch
```

This will automatically regenerate types when you modify `.graphql` files.

## Package Structure

```
apps/graphql-client/
├── documents/           # Your .graphql query files
│   ├── getDaoData.graphql
│   └── getProposalData.graphql
├── generated.ts         # Generated React hooks
├── types.ts            # Generated TypeScript types
├── hooks.ts            # Exports React hooks
├── index.ts            # Main export (types only)
└── codegen.ts          # Code generation config
```

## Import Paths

- **Default (Types)**: `@anticapture/graphql-client`
- **React Hooks**: `@anticapture/graphql-client/hooks`

## Tips

1. **Query Naming**: Use descriptive names like `GetDaoData`, `GetProposalList`
2. **Variables**: Always define proper TypeScript types for variables
3. **Fragments**: Use GraphQL fragments for reusable field selections
4. **Testing**: Test your queries in GraphQL Playground first
5. **Performance**: Use `limit` and pagination for large datasets

## Example Queries

### Simple Query

```graphql
query GetDao($id: String!) {
  dao(id: $id) {
    id
    quorum
    proposalThreshold
  }
}
```

### Query with Filtering

```graphql
query GetRecentProposals($daoId: String!, $limit: Int = 10) {
  proposalsOnchains(
    where: { daoId: $daoId }
    orderBy: "timestamp"
    orderDirection: "desc"
    limit: $limit
  ) {
    items {
      id
      description
      status
      timestamp
    }
  }
}
```

### Query with Fragments

```graphql
fragment ProposalInfo on proposalsOnchain {
  id
  description
  status
  forVotes
  againstVotes
  timestamp
}

query GetProposalWithDetails($id: String!) {
  proposalsOnchain(id: $id) {
    ...ProposalInfo
    proposerAccountId
    calldatas
  }
}
```
