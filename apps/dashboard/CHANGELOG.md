# @anticapture/dashboard

## 2.2.2

### Patch Changes

- [#1894](https://github.com/blockful/anticapture/pull/1894) [`9f50094`](https://github.com/blockful/anticapture/commit/9f5009462c6379984971987e8c7f2be9fc5fc606) Thanks [@pikonha](https://github.com/pikonha)! - perf(dashboard): replace single Suspense boundary in DaoOverviewSection with per-card boundaries so each chart card streams independently

- [#1907](https://github.com/blockful/anticapture/pull/1907) [`029f875`](https://github.com/blockful/anticapture/commit/029f875f9246eedf91e76a1aa326ece02455004e) Thanks [@pikonha](https://github.com/pikonha)! - fix(dashboard): add missing JSX key props in PanelSection Carousel slides

- [#1904](https://github.com/blockful/anticapture/pull/1904) [`34cacf0`](https://github.com/blockful/anticapture/commit/34cacf0672c340674ecfc8fa7745e64608369214) Thanks [@brunod-e](https://github.com/brunod-e)! - create proposal ui fixes

- [#1890](https://github.com/blockful/anticapture/pull/1890) [`cd54040`](https://github.com/blockful/anticapture/commit/cd54040ec415380777a6f316b70b6d28f64cb08c) Thanks [@pikonha](https://github.com/pikonha)! - fix(dashboard): surface off-chain vote state inline, fix modal copy, and eliminate display lag on Snapshot proposals

- [#1896](https://github.com/blockful/anticapture/pull/1896) [`72b977a`](https://github.com/blockful/anticapture/commit/72b977ac49c56698191c0fe79f2d78f2ba3bf8b5) Thanks [@pikonha](https://github.com/pikonha)! - perf: fix derived state in effects and remove isMounted pattern

  Remove accumulatedProposals state/effect in useProposalsActivity (derive from Apollo cache directly), add lazy initialisers for Map/Set state in useDelegates, add timeout cleanup in SectionComposedChart, and inline hasNextPage arithmetic in useDelegateDelegationHistory.

- [#1893](https://github.com/blockful/anticapture/pull/1893) [`3c96b00`](https://github.com/blockful/anticapture/commit/3c96b005f7d16c6220ff1ee024dcf2de21ee2eb6) Thanks [@pikonha](https://github.com/pikonha)! - perf(dashboard): convert Array.includes/some to Set.has in render loops

- [#1902](https://github.com/blockful/anticapture/pull/1902) [`cfb38fa`](https://github.com/blockful/anticapture/commit/cfb38faedf63c63ef10c4830315c64d5f4f0ab67) Thanks [@pikonha](https://github.com/pikonha)! - fix(dashboard): land whitelabel hostnames on `/proposals` instead of leaking the internal `/whitelabel/[daoId]/proposals` path into the URL
