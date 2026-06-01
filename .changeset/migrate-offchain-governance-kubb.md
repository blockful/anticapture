---
"@anticapture/dashboard": patch
---

Migrate offchain governance (proposals, votes, and token metrics in the proposal view) off `@anticapture/graphql-client` to the kubb SDK. Apollo infinite pagination (`fetchMore`) is replaced with react-query infinite queries, and cache refetch is replaced with `invalidateQueries`. No user-visible change.
