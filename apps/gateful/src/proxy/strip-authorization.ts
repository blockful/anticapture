/**
 * Returns a copy of the incoming request headers with `Authorization` removed.
 *
 * The gateway authenticates the caller's per-tenant bearer itself (Authful);
 * that token must never be forwarded to DAO backends or relayers, which
 * authenticate the gateway through their own mechanism.
 */
export function stripAuthorization(headers: Headers): Headers {
  const copy = new Headers(headers);
  copy.delete("authorization");
  return copy;
}
