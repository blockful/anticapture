# Shared agent memory (auto-managed)

Auto-memory Claude writes across the team, git-tracked so it's shared (setup + caveats in
`./README.md`). Writing rules — no secrets, no machine-local paths — are in the repo
`CLAUDE.md`.

## Testing

- **API tests need a local Redis running.** `apps/api` uses Redis for caching
  (`apps/api/src/cache/dao-cache.ts`), so integration tests connect to a Redis instance.
  Start one locally before running `pnpm api test` (e.g. `docker run -p 6379:6379 redis`).
  Pure unit runs that don't touch the cache can use `pnpm api test:unit`.

## Dashboard — whitelabel vs main app layout

- **Whitelabel and the main app must SHARE one layout — do not branch layout on
  `isWhitelabel`/`isWhitelabelRoute`.** Theme differences belong in tokens/content, not
  in structural CSS. Example: the design-system `PillTab` uses `rounded-base`, a _themed_
  token (rounded on whitelabel, square on the main app) — one component serves both; never
  fork it per theme.
- **Pattern for shared proposal views:** `WhitelabelHeader`
  (`apps/dashboard/widgets/WhitelabelHeader.tsx`) returns `null` on proposal-detail **and**
  `proposals/new` routes, so the page renders a single **in-content** header (the
  Editor/Preview toggle + voting-power/`ConnectWalletCustom`) for both surfaces. With the
  header in-content for both, the sticky offsets (`lg:top-[85px]` for the `TabsSection` tab
  bar + the preview sidebar, plus the 65→85px spacer in `DraftPreview`) are identical
  across themes — no per-theme offset overrides.
- **Symptom if you get this wrong:** the whitelabel preview shows a gray band above the
  tabs and clips the first section (e.g. "Synopsis"), because the shell `WhitelabelHeader`
  sits _outside_ the scroll container while the offsets assume an in-scroll 65px header.
  Fix by unifying the header (above), not by zeroing offsets per theme.
- The only legitimate `isWhitelabel` layout branch left is the **mobile** tab offset in
  `TabsSection` (`top-0` vs `top-29.5`) — the two mobile shells genuinely differ in height.
- **Mobile sticky bottom bars:** the app/whitelabel shells must size their scroll
  containers with `h-dvh` (not `h-screen`/`100vh`), or a `sticky bottom-0` action bar
  (e.g. create-proposal Publish/Save Draft) hides behind the mobile browser's bottom
  toolbar.
