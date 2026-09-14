import type { Hash } from "viem";

import {
  runWalletSubmission,
  type SubmissionReceipt,
} from "@/features/governance/utils/walletSubmission";

const broadcastHash: Hash = `0x${"ab".repeat(32)}`;
const receiptHash: Hash = `0x${"cd".repeat(32)}`;

const receipt = (status: SubmissionReceipt["status"]): SubmissionReceipt => ({
  status,
  transactionHash: receiptHash,
});

describe("runWalletSubmission", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("reports a mined transaction as a success", async () => {
    const outcome = await runWalletSubmission(async (onBroadcast) => {
      onBroadcast(broadcastHash);
      return receipt("success");
    });

    expect(outcome).toEqual({ status: "success", hash: receiptHash });
  });

  it("reports a mined but reverted transaction as reverted", async () => {
    const outcome = await runWalletSubmission(async (onBroadcast) => {
      onBroadcast(broadcastHash);
      return receipt("reverted");
    });

    expect(outcome).toEqual({ status: "reverted", hash: receiptHash });
  });

  it("reports a receipt failure after the broadcast as unconfirmed, keeping the hash", async () => {
    const outcome = await runWalletSubmission(async (onBroadcast) => {
      onBroadcast(broadcastHash);
      throw new Error("timed out while waiting for transaction receipt");
    });

    // Neither a success nor a failure: the governance call may still land, so
    // the caller must show this without a retry.
    expect(outcome).toEqual({ status: "unconfirmed", hash: broadcastHash });
  });

  it("rethrows a failure that happened before any broadcast", async () => {
    const rejection = new Error("User rejected the request.");

    await expect(
      runWalletSubmission(async () => {
        throw rejection;
      }),
    ).rejects.toBe(rejection);
  });

  it("rethrows a simulation revert, where nothing was sent", async () => {
    const revert = new Error(
      "execution reverted: Governor: proposal not queued",
    );

    await expect(
      runWalletSubmission(async () => {
        throw revert;
      }),
    ).rejects.toBe(revert);
  });
});
