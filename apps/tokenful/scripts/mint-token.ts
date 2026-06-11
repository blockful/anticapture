/**
 * Mint (or seed) a tenant token directly against the database.
 *
 * Generate a new token:
 *   pnpm tokenful mint -- <tenant> <name> [--rate-limit <per-min>]
 *
 * Seed an existing credential without rotating it (migration path for the
 * legacy shared keys, e.g. Uniswap's current MCP key):
 *   TOKEN_PLAINTEXT=<existing-key> pnpm tokenful mint -- <tenant> <name>
 *
 * The plaintext is read from the TOKEN_PLAINTEXT env var — never from argv —
 * so secrets don't leak into shell history or process listings.
 */
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../src/database/schema";
import { env } from "../src/env";
import { TokensRepository } from "../src/repositories/tokens";
import { TokensService } from "../src/services/tokens";

const args = process.argv.slice(2).filter((a) => a !== "--");
const [tenant, name] = args;
const rateLimitFlag = args.indexOf("--rate-limit");
const rateLimitPerMin =
  rateLimitFlag !== -1 ? Number(args[rateLimitFlag + 1]) : undefined;

if (!tenant || !name) {
  console.error(
    "usage: pnpm tokenful mint -- <tenant> <name> [--rate-limit <per-min>]",
  );
  process.exit(1);
}
if (rateLimitPerMin !== undefined && !Number.isInteger(rateLimitPerMin)) {
  console.error("--rate-limit must be an integer");
  process.exit(1);
}

const db = drizzle(env.DATABASE_URL, { schema });
const service = new TokensService(new TokensRepository(db));

const { token, plaintext } = await service.mint({
  tenant,
  name,
  rateLimitPerMin,
  plaintext: process.env["TOKEN_PLAINTEXT"],
});

console.log(`minted token for tenant "${token.tenant}" (${token.name})`);
console.log(`  id:             ${token.id}`);
console.log(`  rate limit:     ${token.rateLimitPerMin}/min`);
if (process.env["TOKEN_PLAINTEXT"]) {
  console.log("  plaintext:      (seeded from TOKEN_PLAINTEXT, not echoed)");
} else {
  console.log(`  plaintext:      ${plaintext}`);
  console.log("  ^ shown exactly once — only the sha256 hash is stored");
}
process.exit(0);
