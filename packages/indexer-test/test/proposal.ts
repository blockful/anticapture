// import { describe, expect, it } from "vitest";
import { test } from "node:test";
import assert from "node:assert";

import { anvil } from "viem/chains";
import { createPublicClient, http } from "viem";

test("test", async () => {
  const publicClient = createPublicClient({
    chain: anvil,
    transport: http("http://localhost:8545"),
  });

  assert.strictEqual(1 + 1, 2);

  assert.strictEqual(await publicClient.getChainId(), 31337);

  const balance = await publicClient.getBalance({
    address: "0x76A6D08b82034b397E7e09dAe4377C18F132BbB8",
  });

  console.log({ balance });
});
