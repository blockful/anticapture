import type { Hash, PublicClient } from "viem";

import { relayExecute, relayQueue } from "@anticapture/client";

import {
  canRelayGovernanceAction,
  getRelayBlockedReason,
  relayGovernanceAction,
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

  const clientWith = (waitForTransactionReceipt: jest.Mock): PublicClient =>
    ({ waitForTransactionReceipt }) as unknown as PublicClient;

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
      publicClient: clientWith(waitForTransactionReceipt),
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
      publicClient: clientWith(waitForTransactionReceipt),
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
      publicClient: clientWith(waitForTransactionReceipt),
      onTxSubmitted,
    });

    expect(onTxSubmitted).toHaveBeenCalledWith(transactionHash);
    expect(outcome).toEqual({ hash: transactionHash, status: "unconfirmed" });
  });

  it("propagates relayer errors without reporting a submission", async () => {
    const relayerError = Object.assign(new Error("Conflict"), {
      status: 409,
      response: {
        status: 409,
        data: { code: "SIMULATION_FAILED", error: "reverted" },
      },
    });
    mockedRelayExecute.mockRejectedValue(relayerError);
    const onTxSubmitted = jest.fn();

    await expect(
      relayGovernanceAction({
        action: "execute",
        daoId: DaoIdEnum.ENS,
        proposalId,
        publicClient: null,
        onTxSubmitted,
      }),
    ).rejects.toBe(relayerError);
    expect(onTxSubmitted).not.toHaveBeenCalled();
  });
});
