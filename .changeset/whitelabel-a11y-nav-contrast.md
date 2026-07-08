---
"@anticapture/dashboard": patch
---

Accessibility & maintainability fixes in the whitelabel UI: the offchain voting modal now uses the shared Radix Dialog primitive (proper `role="dialog"`/`aria-modal`, focus trap, escape, and scroll-lock), the desktop sidebar and mobile drawer share one `NAV_ITEMS` source so they can't drift, and the brand link-contrast floor is raised to WCAG's 3:1 minimum.
