import { sign } from "hono/jwt";
import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { issueSession, verifySession } from "./session.js";

const SECRET = "test-secret-0123456789abcdef0123456789abcdef";
const ADDRESS = getAddress("0x1111111111111111111111111111111111111111");

describe("session", () => {
  it("round-trips address and claims", async () => {
    const token = await issueSession({
      address: ADDRESS,
      secret: SECRET,
      expiresInSec: 3600,
      claims: { role: "delegate" },
    });

    const session = await verifySession(token, SECRET);

    expect(session.address).toBe(ADDRESS);
    expect(session.claims.role).toBe("delegate");
  });

  it("rejects a tampered token", async () => {
    const token = await issueSession({
      address: ADDRESS,
      secret: SECRET,
      expiresInSec: 3600,
    });

    const [header, payload, signature] = token.split(".");
    const tamperedSignature = `${signature.slice(0, -4)}${
      signature.slice(-4) === "AAAA" ? "BBBB" : "AAAA"
    }`;
    const tampered = `${header}.${payload}.${tamperedSignature}`;

    await expect(verifySession(tampered, SECRET)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const token = await issueSession({
      address: ADDRESS,
      secret: SECRET,
      expiresInSec: -10,
    });

    await expect(verifySession(token, SECRET)).rejects.toThrow();
  });

  it("rejects a weak secret", async () => {
    await expect(
      issueSession({ address: ADDRESS, secret: "too-short", expiresInSec: 60 }),
    ).rejects.toThrow(/secret/i);
  });

  it("rejects a token signed with a different algorithm", async () => {
    const iat = Math.floor(Date.now() / 1000);
    const token = await sign(
      { sub: ADDRESS, iat, exp: iat + 3600 },
      SECRET,
      "HS384",
    );

    await expect(verifySession(token, SECRET)).rejects.toThrow();
  });
});
