import type { Hash } from "viem";

import { relayExecute, relayQueue } from "@anticapture/client";

import {
  canRelayGovernanceAction,
  getRelayBlockedReason,
  relayGovernanceAction,
  type ReceiptWaiter,
} from "@/features/governance/utils/relayGovernanceAction";
import { DaoIdEnum } from "@/shared/types/daos";

jest.mock("@anticapture/client", () => ({
  relayQueue: jest.fn(),
  relayExecute: jest.fn(),
}));

const mockedRelayQueue = relayQueue as jest.MockedFunction<typeof relayQueue>;
const mockedRelayExecute = relayExecute as jest.MockedFunction<
  typeof relayExecute
>;

const transactionHash: Hash = `0x${"ab".repeat(32)}`;
const proposalId =
  "69304512515872868228453463730257567312488838925636819022683533220991373699419";

const relayerError = (status: number, code?: string) =>
  Object.assign(new Error("Request failed"), {
    status,
    response: {
      status,
      statusText: "",
      headers: new Headers(),
      data: code ? { code, error: code } : { error: "boom" },
    },
  });

/** A 5xx whose body is an HTML/plain-text page (proxy, CDN, crashed upstream). */
const textBodyError = (status: number, body: string) =>
  Object.assign(new Error("Request failed"), {
    status,
    response: { status, statusText: "", headers: new Headers(), data: body },
  });

/**
 * A typed test double for the one public-client capability the flow uses.
 * `jest.fn()` is assignable to the method type, so no cast is needed and a
 * change to `ReceiptWaiter` surfaces here as a type error.
 */
const receiptWaiter = (
  waitForTransactionReceipt: ReceiptWaiter["waitForTransactionReceipt"],
): ReceiptWaiter => ({ waitForTransactionReceipt });

describe("canRelayGovernanceAction", () => {
  it("allows queue only for succeeded proposals", () => {
    expect(canRelayGovernanceAction("queue", "succeeded")).toBe(true);
    expect(canRelayGovernanceAction("queue", "SUCCEEDED")).toBe(true);
    expect(canRelayGovernanceAction("queue", "queued")).toBe(false);
    expect(canRelayGovernanceAction("queue", "ongoing")).toBe(false);
  });

  it("allows execute only once the timelock eta has passed", () => {
    expect(canRelayGovernanceAction("execute", "pending_execution")).toBe(true);
    expect(canRelayGovernanceAction("execute", "queued")).toBe(false);
    expect(canRelayGovernanceAction("execute", "succeeded")).toBe(false);
  });
});

describe("getRelayBlockedReason", () => {
  it("returns null when the action can be relayed", () => {
    expect(getRelayBlockedReason("queue", "succeeded")).toBeNull();
    expect(getRelayBlockedReason("execute", "pending_execution")).toBeNull();
  });

  it("explains the timelock wait for queued proposals", () => {
    expect(getRelayBlockedReason("execute", "queued")).toMatch(/timelock/i);
  });

  it("explains the state requirement otherwise", () => {
    expect(getRelayBlockedReason("queue", "ongoing")).toMatch(/succeeded/i);
    expect(getRelayBlockedReason("execute", "succeeded")).toMatch(/queued/i);
  });
});

describe("relayGovernanceAction", () => {
  beforeEach(() => {
    mockedRelayQueue.mockReset();
    mockedRelayExecute.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("queues through the relayer with the lowercase dao key", async () => {
    mockedRelayQueue.mockResolvedValue({ transactionHash });
    const onTxSubmitted = jest.fn();
    const waitForTransactionReceipt = jest
      .fn()
      .mockResolvedValue({ status: "success" });

    const outcome = await relayGovernanceAction({
      action: "queue",
      daoId: DaoIdEnum.ENS,
      proposalId,
      publicClient: receiptWaiter(waitForTransactionReceipt),
      onTxSubmitted,
    });

    expect(mockedRelayQueue).toHaveBeenCalledWith("ens", { proposalId });
    expect(mockedRelayExecute).not.toHaveBeenCalled();
    expect(onTxSubmitted).toHaveBeenCalledWith(transactionHash);
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: transactionHash,
    });
    expect(outcome).toEqual({ hash: transactionHash, status: "success" });
  });

  it("executes through the relayer and reports unconfirmed without a client", async () => {
    mockedRelayExecute.mockResolvedValue({ transactionHash });
    const onTxSubmitted = jest.fn();

    const outcome = await relayGovernanceAction({
      action: "execute",
      daoId: DaoIdEnum.ENS,
      proposalId,
      publicClient: null,
      onTxSubmitted,
    });

    expect(mockedRelayExecute).toHaveBeenCalledWith("ens", { proposalId });
    expect(mockedRelayQueue).not.toHaveBeenCalled();
    expect(onTxSubmitted).toHaveBeenCalledWith(transactionHash);
    expect(outcome).toEqual({ hash: transactionHash, status: "unconfirmed" });
  });

  it("reports a mined-but-reverted transaction instead of success", async () => {
    mockedRelayExecute.mockResolvedValue({ transactionHash });
    const waitForTransactionReceipt = jest
      .fn()
      .mockResolvedValue({ status: "reverted" });

    const outcome = await relayGovernanceAction({
      action: "execute",
      daoId: DaoIdEnum.ENS,
      proposalId,
      publicClient: receiptWaiter(waitForTransactionReceipt),
      onTxSubmitted: jest.fn(),
    });

    expect(outcome).toEqual({ hash: transactionHash, status: "reverted" });
  });

  it("reports unconfirmed when the receipt wait fails after broadcast", async () => {
    mockedRelayQueue.mockResolvedValue({ transactionHash });
    const waitForTransactionReceipt = jest
      .fn()
      .mockRejectedValue(new Error("timeout"));
    const onTxSubmitted = jest.fn();

    const outcome = await relayGovernanceAction({
      action: "queue",
      daoId: DaoIdEnum.ENS,
      proposalId,
      publicClient: receiptWaiter(waitForTransactionReceipt),
      onTxSubmitted,
    });

    expect(onTxSubmitted).toHaveBeenCalledWith(transactionHash);
    expect(outcome).toEqual({ hash: transactionHash, status: "unconfirmed" });
  });

  it("rethrows pre-broadcast relayer rejections", async () => {
    const rejection = relayerError(409, "SIMULATION_FAILED");
    mockedRelayExecute.mockRejectedValue(rejection);
    const onTxSubmitted = jest.fn();

    await expect(
      relayGovernanceAction({
        action: "execute",
        daoId: DaoIdEnum.ENS,
        proposalId,
        publicClient: null,
        onTxSubmitted,
      }),
    ).rejects.toBe(rejection);
    expect(onTxSubmitted).not.toHaveBeenCalled();
  });

  it("rethrows a reverted broadcast reported by the relayer", async () => {
    const reverted = relayerError(409, "TRANSACTION_REVERTED");
    mockedRelayQueue.mockRejectedValue(reverted);

    await expect(
      relayGovernanceAction({
        action: "queue",
        daoId: DaoIdEnum.ENS,
        proposalId,
        publicClient: null,
        onTxSubmitted: jest.fn(),
      }),
    ).rejects.toBe(reverted);
  });

  it.each([
    ["a gateway timeout", relayerError(504)],
    ["a plain 5xx without a relayer code", relayerError(503)],
    ["a network failure", new TypeError("Failed to fetch")],
    [
      "a 5xx with an HTML error page instead of JSON",
      textBodyError(502, "<html><body>Bad gateway</body></html>"),
    ],
  ])(
    "reports unknown for %s instead of failing",
    async (_label, transportError) => {
      mockedRelayExecute.mockRejectedValue(transportError);
      const onTxSubmitted = jest.fn();

      const outcome = await relayGovernanceAction({
        action: "execute",
        daoId: DaoIdEnum.ENS,
        proposalId,
        publicClient: receiptWaiter(jest.fn()),
        onTxSubmitted,
      });

      expect(outcome).toEqual({ status: "unknown", hash: null });
      expect(onTxSubmitted).not.toHaveBeenCalled();
    },
  );
});
