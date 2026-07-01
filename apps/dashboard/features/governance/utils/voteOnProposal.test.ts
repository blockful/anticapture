import type { Account, Address, Chain, WalletClient } from "viem";

import { voteOnProposal } from "@/features/governance/utils/voteOnProposal";
import { DaoIdEnum } from "@/shared/types/daos";

jest.mock("@anticapture/client", () => ({
  relayVote: jest.fn(),
}));

jest.mock("@/features/governance/utils/showCustomToast", () => ({
  showCustomToast: jest.fn(),
}));

const governor = "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce";
const accountAddress = "0x1111111111111111111111111111111111111111";
const transactionHash = "0x2222222222222222222222222222222222222222";
const delegatorAddresses: Address[] = [
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
];

describe("voteOnProposal", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses Tornado Cash castDelegatedVote for binary votes", async () => {
    const account = { address: accountAddress } as unknown as Account;
    const request = { to: governor };
    const simulateContract = jest.fn().mockResolvedValue({ request });
    const writeContract = jest.fn().mockResolvedValue(transactionHash);
    const waitForTransactionReceipt = jest
      .fn()
      .mockResolvedValue({ transactionHash });
    const walletClient = {
      extend: jest.fn(() => ({
        simulateContract,
        writeContract,
        waitForTransactionReceipt,
      })),
    } as unknown as WalletClient;
    const setTransactionhash = jest.fn();

    const receipt = await voteOnProposal(
      "for",
      "42",
      account,
      {} as Chain,
      DaoIdEnum.TORN,
      walletClient,
      setTransactionhash,
      undefined,
      undefined,
      false,
      delegatorAddresses,
    );

    expect(receipt).toEqual({ transactionHash });
    expect(simulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: governor,
        functionName: "castDelegatedVote",
        args: [delegatorAddresses, 42n, true],
        account,
      }),
    );
    expect(writeContract).toHaveBeenCalledWith(request);
    expect(setTransactionhash).toHaveBeenNthCalledWith(1, transactionHash);
    expect(setTransactionhash).toHaveBeenNthCalledWith(2, "");
  });

  it("rejects Tornado Cash abstain votes before sending a transaction", async () => {
    const account = { address: accountAddress } as unknown as Account;
    const simulateContract = jest.fn();
    const walletClient = {
      extend: jest.fn(() => ({
        simulateContract,
      })),
    } as unknown as WalletClient;

    const receipt = await voteOnProposal(
      "abstain",
      "42",
      account,
      {} as Chain,
      DaoIdEnum.TORN,
      walletClient,
      jest.fn(),
    );

    expect(receipt).toBeNull();
    expect(simulateContract).not.toHaveBeenCalled();
  });
});
