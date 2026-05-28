---
"@anticapture/dashboard": patch
---

Add Umami and PostHog event tracking for `proposal_create_click` on the governance "New Proposal" button (with `dao` property) and `feature_request_click` on the whitelabel "Request feature" links in both the shell and sidebar (with `source` property). The PostHog click handler now also captures an optional `dao` property from `data-ph-dao`.
