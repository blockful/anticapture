---
"@anticapture/api": patch
"@anticapture/gateful": patch
---

Flatten `TokenPropertiesResponse` so the MCP `token` tool can validate its own
responses.

`TokenPropertiesResponseSchema` extended the registered `TokenProperties`
component, which zod-openapi emits as `allOf: [$ref TokenProperties, { price }]`.
The MCP server projects output schemas with `io: "output"`, where Zod marks every
object `additionalProperties: false` — so the `{ price }` member rejected the
eleven properties carried by the sibling `$ref` and every `token` call failed
with `Invalid structured content returned by tool token`.

`TokenProperties` was referenced nowhere else in the spec (it existed only to be
extended), so it is no longer registered as its own component and
`TokenPropertiesResponse` is emitted as a flat object. The wire payload is
unchanged — same twelve fields, all still required. The generated SDK loses the
now-unused `TokenProperties` type.
