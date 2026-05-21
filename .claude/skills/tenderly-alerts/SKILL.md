---
name: tenderly-alerts
description: Use when setting up real-time blockchain monitoring on Tenderly — creating wallet/contract alerts (balance thresholds, transaction status, function calls, ERC20 transfers, event emissions), wiring Slack/webhook notifications via the Alerts REST API, troubleshooting 400 "Expressions are not in the right format" errors, or programmatically managing alerts outside the dashboard
---

# Tenderly Alerts

## Overview

Tenderly's Alerts API lets you provision real-time on-chain monitoring (balance, tx status, function calls, events, ERC20 transfers) and route notifications to Slack/email/webhooks. The public docs describe the dashboard flow but leave the API's expression schema mostly undocumented — expression type names in the docs (`successful_tx`, `failed_tx`, etc.) return `400 "Expressions are not in the right format"`. This skill captures the empirically-verified schema and the gotchas.

## Core Pattern

An alert is an array of `expressions` (AND'd together) plus a list of `delivery_channels`. Each expression is `{ type, expression: {...} }`. Type names are NOT free-form — only specific strings work. Wrong type or unknown field → silent drop or 400.

## Quick Reference

### Auth

```bash
# Generate at https://dashboard.tenderly.co/account/authorization
# Header: X-Access-Key (NOT Authorization: Bearer)
curl -H "X-Access-Key: $TOKEN" https://api.tenderly.co/api/v1/...
```

The `me` alias for account slug **does not work** — use the real slug from the dashboard URL (`dashboard.tenderly.co/<slug>/<project>`). 401 with the right header almost always means wrong slug or empty token (env vars don't persist across separate shell invocations — write the token to a file with `chmod 600`).

### Endpoints

| Method | Path                                        | Purpose                                                                       |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/account/{slug}/projects`                  | List projects                                                                 |
| GET    | `/account/{slug}/delivery-channels`         | List notification destinations                                                |
| GET    | `/account/{slug}/project/{proj}/alerts`     | List alerts                                                                   |
| POST   | `/account/{slug}/project/{proj}/alert`      | Create alert (singular!)                                                      |
| GET    | `/account/{slug}/project/{proj}/alert/{id}` | Get alert                                                                     |
| PATCH  | `/account/{slug}/project/{proj}/alert/{id}` | Update alert (requires FULL payload, not partial — `name` field is mandatory) |
| DELETE | `/account/{slug}/project/{proj}/alert/{id}` | Delete alert                                                                  |

`PUT` returns 404 — only PATCH works. Despite the name, PATCH is not a partial update: it rejects with `"Name cannot be empty"` if you omit fields. Standard pattern: GET → mutate the returned `alert` object → PATCH with full body (drop server-managed fields like `id`, `project_id`, `created_at`, `updated_at`, `color`).

Base URL: `https://api.tenderly.co/api/v1`.

### Verified expression types

| `type`                         | `expression` shape                        | Notes                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `network`                      | `{network_id: "1"}`                       | Chain ID as **string**. Required to scope alerts to a chain.                                                                                                                        |
| `eth_balance`                  | `{address, threshold, operator}`          | `threshold` is wei as string. `operator` ∈ `<`, `<=`, `>`, `>=`, `==`, `!=`. Triggers on tx that mutates the balance, not on existing state.                                        |
| `tx_status`                    | `{transaction_success: true \| false}`    | Does NOT accept `address` — combine with `whitelisted_caller_addresses`.                                                                                                            |
| `whitelisted_caller_addresses` | `{addresses: ["0x..."]}`                  | Filters by tx sender (caller). Addresses lowercased on storage.                                                                                                                     |
| `tx_value`                     | `{transaction_value: "0", operator: ">"}` | Filters by `msg.value` (wei string). Field name is `transaction_value`, NOT `value` — `value` is silently dropped. Combine with `whitelisted_caller_addresses` to filter by sender. |

**Naming pattern:** the inner field for "stateful" filters tends to use a `transaction_*` prefix (`transaction_success`, `transaction_value`). If a `type` returns 200 but your filter field comes back `null`, try renaming the field with that prefix.

### Type names that DON'T work (return 400)

`successful_tx`, `failed_tx`, `successful_transaction`, `failed_transaction`, `from_address`, `caller_address`, `filtered_caller_address`, `transaction_address`, `from`, `to`, `tx`, `address`, `transaction_value` (use `tx_value`), `erc20_transfer`, `erc20_token_transfer`, `erc20`, `transfer`, `token_transfer`, `log_emitted`, `event_emitted`, `log`, `event`.

For unverified alert types (ERC20 transfer, function call, event emitted, state change, view function, allowlisted/blocklisted callers), the dashboard UI is the fastest discovery path: configure it once in the UI, then `GET` the alert via API and copy the `expressions` array as your template.

### Full alert payload

```json
{
  "name": "Wallet outgoing tx succeeded",
  "description": "Optional human-readable context",
  "enabled": true,
  "severity": "info | warning | critical",
  "expressions": [
    { "type": "network", "expression": { "network_id": "1" } },
    { "type": "tx_status", "expression": { "transaction_success": true } },
    {
      "type": "whitelisted_caller_addresses",
      "expression": { "addresses": ["0xABCD..."] }
    }
  ],
  "delivery_channels": [{ "id": "<channel_uuid>", "enabled": true }]
}
```

## Common recipes

**Balance threshold (wallet running low):**

```json
{
  "expressions": [
    { "type": "network", "expression": { "network_id": "1" } },
    {
      "type": "eth_balance",
      "expression": {
        "address": "0x...",
        "threshold": "100000000000000000",
        "operator": "<"
      }
    }
  ],
  "delivery_channels": [{ "id": "...", "enabled": true }],
  "name": "...",
  "enabled": true
}
```

**Any successful tx from a wallet (activity monitor):** `network` + `tx_status (true)` + `whitelisted_caller_addresses`.

**Failed tx from a wallet (compromise/bug signal):** same as above with `transaction_success: false`.

For the remaining 8 Tenderly alert types (Function Call, Event Emitted, Event Parameter, ERC20 Token Transfer, Allowlisted/Blocklisted Callers, Transaction Value, State Change, View Function) the dashboard UI is the fastest way to discover the exact expression shape: configure the alert in the UI, then `GET` it via API and copy the returned `expressions` array as the template.

## Delivery channels

**Cannot be created via API** — only listed/referenced. Set up the destination (Slack OAuth, webhook URL, email, Discord, Telegram, PagerDuty) in the dashboard at `/account/<slug>/project/<proj>/alerts/destinations`, then:

```bash
curl -H "X-Access-Key: $TOKEN" \
  https://api.tenderly.co/api/v1/account/<slug>/delivery-channels
```

Extract `id` from the response and reuse across alerts. Channels are account-scoped (visible to every project) unless you pick a project scope in the UI.

## Gotchas

- **Unknown fields are silently stripped.** If you send `{type: "tx_status", expression: {address: "0x..", status: "success"}}` the response will show `expression: {transaction_success: null}` — no error, but your filter is gone. Always `GET` the alert after creation to verify the stored shape matches intent.
- **Token in `<bash-input>` / one-shot `export` doesn't persist** across separate Bash tool invocations. Write to `~/.tenderly_token` with `chmod 600` and `cat` it in each curl.
- **Balance alerts trigger on tx mutating the balance, not on state.** A wallet sitting below threshold won't fire — only a tx involving it will re-evaluate.
- **`me` is not a valid account slug** for these endpoints (despite older docs claiming so). Use the real slug.
- **Addresses are lowercased on storage** but matched case-insensitively.

## Negation limitation (no native "NOT in list" expression)

Tenderly's expression set has `Allowlisted Callers` and `Blocklisted Callers`, but those filter callers INTO a target contract, not callees FROM a wallet. To express "tx from W to any address NOT in [A, B, …]" (e.g., key-leak detection for a relayer that should only touch specific contracts), there is no native combination. Workaround: create a Web3 Action triggered by any tx where `from = W`, encode the allowlist in TypeScript, and POST to Slack from the action when the check fails.

## Common Mistakes

| Mistake                                          | What happens                                          | Fix                                                              |
| ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Using `type: "successful_tx"` (or similar guess) | 400 "Expressions are not in the right format"         | Use `tx_status` + `whitelisted_caller_addresses` combo           |
| Putting `address` inside `tx_status.expression`  | Silently dropped, alert fires for all txs             | Use separate `whitelisted_caller_addresses` expression           |
| Omitting `network` expression                    | Alert may match across chains or behave unpredictably | Always include `{type:"network",expression:{network_id:"<id>"}}` |
| Trying to `POST /delivery-channels`              | 404                                                   | Create channel in dashboard, list via API to get id              |
| `Authorization: Bearer <token>`                  | 500 (internal error)                                  | Use `X-Access-Key: <token>`                                      |
| Setting `account_slug = "me"`                    | 401                                                   | Use the real account slug from dashboard URL                     |
| Sending `threshold: 0.1` for eth_balance         | Likely 400 or unexpected behavior                     | Send wei as a string: `"100000000000000000"`                     |

## Verification workflow

After any create/update, always:

1. `GET` the alert by id
2. Diff `expressions` returned vs. what you sent
3. Any missing field = silently stripped → schema is wrong
