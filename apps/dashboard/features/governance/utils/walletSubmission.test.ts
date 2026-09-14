import type { Hash } from "viem";

import {
  classifyWalletFailure,
  isPreSendFailure,
  isUserRejection,
  runWalletSubmission,
  type SubmissionProgress,
  type SubmissionReceipt,
} from "@/features/governance/utils/walletSubmission";

const broadcastHash: Hash = `0x${"ab".repeat(32)}`;
const receiptHash: Hash = `0x${"cd".repeat(32)}`;

const receipt = (status: SubmissionReceipt["status"]): SubmissionReceipt => ({
  status,
  transactionHash: receiptHash,
});

/** A viem-shaped error: a name, and the real reason nested in `cause`. */
const viemError = (name: string, cause?: unknown) =>
  Object.assign(new Error(name), { name, cause });

const rpcError = (code: number) =>
  Object.assign(new Error("RPC error"), { code });

describe("isUserRejection", () => {
  it("recognises the viem error by name", () => {
    expect(isUserRejection(viemError("UserRejectedRequestError"))).toBe(true);
  });

  it("recognises it nested in a cause chain", () => {
    const wrapped = viemError(
      "ContractFunctionExecutionError",
      viemError("TransactionExecutionError", rpcError(4001)),
    );
    expect(isUserRejection(wrapped)).toBe(true);
  });

  it("does not match an unrelated error", () => {
    expect(isUserRejection(new Error("socket hang up"))).toBe(false);
  });

  it("survives a self-referencing cause chain", () => {
    const looping: { name: string; cause?: unknown } = { name: "Weird" };
    looping.cause = looping;
    expect(isUserRejection(looping)).toBe(false);
  });
});

describe("isPreSendFailure", () => {
  it("recognises a chain mismatch, which is raised before the send", () => {
    expect(isPreSendFailure(viemError("ChainMismatchError"))).toBe(true);
  });

  it("recognises insufficient funds nested in a cause chain", () => {
    expect(
      isPreSendFailure(
        viemError(
          "TransactionExecutionError",
          viemError("InsufficientFundsError"),
        ),
      ),
    ).toBe(true);
  });

  it.each([
    "TransactionRejectedRpcError",
    "ExecutionRevertedError",
    "NonceTooLowError",
    "NonceTooHighError",
    "TransactionTypeNotSupportedError",
    "SwitchChainError",
  ])("recognises %s, where the node or wallet refused the send", (name) => {
    expect(isPreSendFailure(viemError(name))).toBe(true);
  });

  it("does not match a transport failure, which says nothing about the send", () => {
    expect(isPreSendFailure(viemError("HttpRequestError"))).toBe(false);
  });

  it("does not match a timeout waiting for the receipt", () => {
    expect(
      isPreSendFailure(viemError("WaitForTransactionReceiptTimeoutError")),
    ).toBe(false);
  });
});

describe("classifyWalletFailure", () => {
  const error = viemError("HttpRequestError");

  it("calls a failure before the send attempt pre-broadcast", () => {
    expect(
      classifyWalletFailure(error, { sendAttempted: false, hash: null }),
    ).toBe("pre-broadcast");
  });

  it("calls a simulation revert pre-broadcast, since the send was never reached", () => {
    expect(
      classifyWalletFailure(viemError("ContractFunctionExecutionError"), {
        sendAttempted: false,
        hash: null,
      }),
    ).toBe("pre-broadcast");
  });

  it("calls a user rejection during the send pre-broadcast", () => {
    expect(
      classifyWalletFailure(viemError("UserRejectedRequestError"), {
        sendAttempted: true,
        hash: null,
      }),
    ).toBe("pre-broadcast");
  });

  it("calls a chain mismatch during the send pre-broadcast", () => {
    expect(
      classifyWalletFailure(viemError("ChainMismatchError"), {
        sendAttempted: true,
        hash: null,
      }),
    ).toBe("pre-broadcast");
  });

  it("calls a lost send response ambiguous rather than retryable", () => {
    // The provider may have broadcast and lost the answer, which looks
    // exactly like never having sent it.
    expect(
      classifyWalletFailure(error, { sendAttempted: true, hash: null }),
    ).toBe("ambiguous");
  });

  it("calls a receipt failure ambiguous once a hash exists", () => {
    expect(
      classifyWalletFailure(error, {
        sendAttempted: true,
        hash: broadcastHash,
      }),
    ).toBe("ambiguous");
  });

  it("keeps a rejection-shaped error ambiguous once a hash exists", () => {
    // Nothing that arrives after the wallet handed back a hash can undo it.
    expect(
      classifyWalletFailure(viemError("UserRejectedRequestError"), {
        sendAttempted: true,
        hash: broadcastHash,
      }),
    ).toBe("ambiguous");
  });
});

describe("runWalletSubmission", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  const reachSend = (progress: SubmissionProgress) => {
    progress.onSendAttempt();
  };

  it("reports a mined transaction as a success", async () => {
    const outcome = await runWalletSubmission(async (progress) => {
      reachSend(progress);
      progress.onBroadcast(broadcastHash);
      return receipt("success");
    });

    expect(outcome).toEqual({ status: "success", hash: receiptHash });
  });

  it("reports a mined but reverted transaction as reverted", async () => {
    const outcome = await runWalletSubmission(async (progress) => {
      reachSend(progress);
      progress.onBroadcast(broadcastHash);
      return receipt("reverted");
    });

    expect(outcome).toEqual({ status: "reverted", hash: receiptHash });
  });

  it("reports a receipt failure as ambiguous, keeping the hash", async () => {
    const outcome = await runWalletSubmission(async (progress) => {
      reachSend(progress);
      progress.onBroadcast(broadcastHash);
      throw viemError("WaitForTransactionReceiptTimeoutError");
    });

    expect(outcome).toEqual({ status: "ambiguous", hash: broadcastHash });
  });

  it("reports a lost send response as ambiguous without a hash", async () => {
    const outcome = await runWalletSubmission(async (progress) => {
      reachSend(progress);
      throw viemError("HttpRequestError");
    });

    // No hash, so the screen can offer no explorer link and no retry.
    expect(outcome).toEqual({ status: "ambiguous", hash: null });
  });

  it("rethrows a user rejection, where nothing was sent", async () => {
    const rejection = viemError("UserRejectedRequestError");

    await expect(
      runWalletSubmission(async (progress) => {
        reachSend(progress);
        throw rejection;
      }),
    ).rejects.toBe(rejection);
  });

  it("rethrows a simulation failure raised before the send attempt", async () => {
    const revert = viemError("ContractFunctionExecutionError");

    await expect(
      runWalletSubmission(async () => {
        throw revert;
      }),
    ).rejects.toBe(revert);
  });
});
