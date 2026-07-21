---
id: index
title: Webhooks
sidebar_position: 5
hide_table_of_contents: true
---

# Webhooks

Instead of polling the REST API, register an HTTPS endpoint with the Webhook
Notification API and Anticapture pushes signed governance notifications for all
DAOs to it.

The webhook service is hosted separately from the REST API:

```
https://webhook.anticapture.com
```

## Registering an endpoint

Register your receiver URL with a single request:

```bash
curl -X POST https://webhook.anticapture.com/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/anticapture-webhook"}'
```

On **first registration** the response includes a one-time HMAC secret used to
verify delivery signatures:

```json
{
  "success": true,
  "secret": "whsec_...",
  "note": "Store this secret now; it is never shown again."
}
```

:::warning Store the secret immediately
The secret is returned **only once**. Re-registering an already-active webhook
returns `{ "success": true }` without a secret.
:::

To stop deliveries, deactivate the endpoint with `DELETE /webhooks` and the
same payload; see the [reference](#reference) below for both operations.

## Verifying deliveries

Every delivery is signed with **HMAC-SHA256** so you can prove it came from
Anticapture:

| Header                   | Content                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `X-Webhook-Timestamp`    | Delivery time, Unix seconds                                        |
| `X-Webhook-Signature-V2` | `HMAC-SHA256("{timestamp}.{rawBody}", secret)` as a raw hex digest |

To verify, recompute the signature over `"{timestamp}.{rawBody}"` with your
stored secret and compare using a **timing-safe comparison**. Reject deliveries
whose timestamp is more than **5 minutes** old to prevent replay attacks.

### Example receiver (Node.js)

```js
import { createHmac, timingSafeEqual } from "node:crypto";
import express from "express";

const SECRET = process.env.ANTICAPTURE_WEBHOOK_SECRET;
const MAX_AGE_SECONDS = 5 * 60;

const app = express();

// The signature covers the RAW body; parse it only after verifying.
app.post(
  "/anticapture-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const timestamp = req.header("X-Webhook-Timestamp");
    const signature = req.header("X-Webhook-Signature-V2");

    if (!timestamp || !signature) return res.status(400).end();

    const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(ageSeconds) || ageSeconds > MAX_AGE_SECONDS) {
      return res.status(400).end(); // replay protection
    }

    const expected = createHmac("sha256", SECRET)
      .update(`${timestamp}.${req.body}`)
      .digest("hex");

    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return res.status(401).end();
    }

    const event = JSON.parse(req.body);
    // ...handle the notification...
    res.status(200).end();
  },
);

app.listen(3000);
```

Respond with a `2xx` status quickly; do any heavy processing asynchronously.

## Reference

The pages below are generated from the live
[Webhook Notification API spec](https://webhook.anticapture.com/docs/json).
