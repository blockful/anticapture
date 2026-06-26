# `.agents/shared-memory/` — shared Claude Code auto-memory

This folder is Claude Code's **auto memory** directory, redirected from its default
machine-local location (`~/.claude/projects/<project>/memory/`) into the repo so that
auto-learned knowledge is **shared across the team via git**.

## What it is

- Claude Code writes notes here automatically as it works (build commands, debugging
  insights, conventions). You'll see "Writing memory" / "Recalled memory" in the UI.
- `MEMORY.md` is the index, loaded into every session (first ~200 lines / 25KB).
- Topic files (`debugging.md`, etc.) load on demand.
- **Not curated.** Unlike a hand-written memory doc, nobody reviews this in a PR before
  Claude writes it. Curation happens after the fact, by editing/pruning these files.

## Setup (each dev, once)

`autoMemoryDirectory` must be an **absolute path** (Claude Code does not accept a
repo-relative path), so it can't be committed in the shared `settings.json`. Each dev
points their **local** settings at their own clone:

`.claude/settings.local.json` (gitignored):

```json
{
  "autoMemoryDirectory": "<ABSOLUTE-PATH-TO-REPO>/.agents/shared-memory"
}
```

Requires Claude Code v2.1.59+. Toggle/inspect with the `/memory` command.

## Caveats

- **Merge conflicts**: multiple devs auto-writing the same files will conflict. Topic
  files reduce collisions; `MEMORY.md` (the shared index) is the hot spot.
- **Secrets/noise**: auto-memory records whatever Claude finds useful, which can include
  local absolute paths or sensitive snippets. Review `git status` here before committing.
- Sharing is **manual at the git layer**: writes are automatic, but they only reach
  teammates on commit + push + pull.
