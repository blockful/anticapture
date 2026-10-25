---
"@anticapture/gateful": minor
---

Always answer GET /{dao}/relay/status with 200: pass the relayer's answer through, and answer on its behalf with available: false when it cannot, reporting RELAYER_NOT_CONFIGURED for a DAO without a relayer and RELAYER_UNREACHABLE when the relayer is down, times out, answers with anything but a valid status, or its circuit is open. The probe goes straight to the relayer, so it never trips or occupies the circuit breaker that real relay traffic depends on. It logs once when it starts answering for a relayer that cannot answer and once when that relayer is reachable again
