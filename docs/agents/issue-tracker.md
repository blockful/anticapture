# Issue Tracker

Issues for this repo live in **ClickUp** (workspace `90132341641`, space **Tech** `901310533741`). Use the ClickUp MCP tools (`mcp__clickup__*`) to read, create, and update tasks.

## Where things live

- **Backlog** — list at https://app.clickup.com/90132341641/v/l/2ky4wrw9-4013. New issues are created here by default. **This backlog is shared across all company projects** — tasks belonging to this repo must have the **Anticapture** project relationship set. When creating a task, add the Anticapture project relationship; when reading the backlog, filter to tasks related to the Anticapture project.
- **Sprints** — folder **Sprints** (`901313871733`) in the Tech space: https://app.clickup.com/90132341641/v/o/f/901313871733?pr=901310533741. Each list in the folder is one sprint; **the last list in the folder is the current sprint** (Sprint 43 as of 2026-07-20 — always resolve dynamically, don't hardcode).

## Statuses

The space uses this pipeline (in order):

| Status            | Group       | Meaning                        |
| ----------------- | ----------- | ------------------------------ |
| `BACKLOG`         | Not started | Not yet scheduled              |
| `TODO`            | Active      | Scheduled, not started         |
| `IN PROGRESS`     | Active      | Being implemented              |
| `CODE REVIEW`     | Active      | PR open, awaiting review       |
| `CR CODE CHANGES` | Active      | Review requested changes       |
| `QA`              | Active      | Functional QA                  |
| `UX QA`           | Active      | Design/UX review               |
| `REPROVED BY QA`  | Active      | QA found problems, back to dev |
| `BLOCKED`         | Active      | Blocked on something external  |
| `APPROVED BY QA`  | Active      | QA passed, awaiting release    |
| `DONE`            | Done        | Shipped                        |
| `CANCELLED`       | Closed      | Will not be done               |

## Conventions for agents

- **Creating an issue** (`to-tickets`, `qa`, etc.): create a task in the Backlog list with status `BACKLOG`. Include a clear title, description, and repro/acceptance criteria in the task description (markdown).
- **Reading the queue** (`triage`, `to-spec`): pull tasks from the Backlog list and the current sprint list.
- **Triage vocabulary**: applied as ClickUp **tags** — see `docs/agents/triage-labels.md`.
- **Status changes**: agents may move `BACKLOG → TODO` (when scoping) and `IN PROGRESS → CODE REVIEW` (when a PR is opened). Leave QA/Done transitions to humans.

## PRs as a request surface

Off. External PRs are not part of the triage queue.
