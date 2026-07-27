# Gateful

REST/OpenAPI gateway for Anticapture DAO APIs.

## Authful configuration

When token authentication is enabled, all three variables are required:

| Variable                      | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `TOKEN_SERVICE_URL`           | Authful base URL                                                                                                    |
| `TOKEN_SERVICE_API_KEY`       | Authful internal key used for token validation                                                                      |
| `TOKEN_SERVICE_USAGE_API_KEY` | Authful usage-only key (`USAGE_API_KEY`) used to flush `user:*` daily usage every 60 seconds; cannot mint or revoke |

`GATEFUL_AUTH_DISABLED=true` is local-development-only and disables both token
authentication and per-user usage collection. Production deployments must
configure Authful instead.

Usage is buffered in memory, assigned to UTC calendar days, retried after
transient Authful failures, and flushed during `SIGTERM` shutdown. Prometheus
tenant bucketing remains unchanged.
