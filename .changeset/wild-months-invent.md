---
"@anticapture/client": patch
---

Fix the MCP server advertising an unsatisfiable output schema for every tool
whose response is a discriminated union (`proposal`, `proposals`,
`searchProposals`).

Kubb's default `discriminator: "strict"` re-asserts each `oneOf` branch's
discriminator as an intersection — `OnchainFullProposal AND { variant: "full" }`
— even though every branch already declares its own `variant` literal.
`registerTool` projects output schemas with `io: "output"`, where Zod marks
objects `additionalProperties: false`, so the `allOf` member that declares only
`variant` rejects the other 20+ real properties. Neither variant could validate,
and every call failed client-side with `RuntimeError: Invalid structured content
returned by tool proposal` — the data was always correct, only the advertised
schema was impossible.

Switching to `discriminator: "inherit"` emits a plain union of the mapped
branches, which projects to a satisfiable `anyOf`.
