// import { describe, expect, it } from "vitest";
import { test } from "node:test";
// import assert from "node:assert";

import { hardhat } from "viem/chains";
import {
  createTestClient,
  encodeFunctionData,
  http,
  parseEther,
  publicActions,
  walletActions,
  zeroAddress,
} from "viem";

import { ENSGovernorAbi, ENSTokenAbi } from "@anticapture/indexer/ens";
import { CONTRACT_ADDRESSES } from "@anticapture/indexer/contracts";

test("test", async () => {
  const client = createTestClient({
    chain: hardhat,
    mode: "hardhat",
    transport: http("http://localhost:8545"),
    account: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
  })
    .extend(publicActions)
    .extend(walletActions);

  const {
    governor: { address: GOVERNOR },
    token: { address: TOKEN },
  } = CONTRACT_ADDRESSES["ENS"];

  await client.impersonateAccount({
    address: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
  });

  const proposalId = await client.writeContract({
    address: GOVERNOR,
    abi: ENSGovernorAbi,
    functionName: "propose",
    args: [
      [TOKEN],
      [0n],
      [
        encodeFunctionData({
          abi: ENSTokenAbi,
          functionName: "transfer",
          args: [zeroAddress, parseEther("0.1")],
        }),
      ],
      "aeuhgeauhuae",
    ],
  });

  console.log({ proposalId });
});
