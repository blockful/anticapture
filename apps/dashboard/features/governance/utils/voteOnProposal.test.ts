import { createWalletClient, custom, encodeFunctionData } from "viem";
import type { Account, Address, Hex } from "viem";
import { mainnet } from "viem/chains";

import { voteOnProposal } from "@/features/governance/utils/voteOnProposal";
import { DaoIdEnum } from "@/shared/types/daos";

jest.mock("@anticapture/client", () => ({
  relayVote: jest.fn(),
}));

jest.mock("@/features/governance/utils/showCustomToast", () => ({
  showCustomToast: jest.fn(),
}));

const tornGovernor: Address = "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce";
const uniGovernor: Address = "0x408ED6354d4973f66138C91495F2f2FCbd8724C3";
const accountAddress: Address = "0x1111111111111111111111111111111111111111";
const transactionHash: Hex = `0x${"22".repeat(32)}`;
const delegatorAddresses: Address[] = [
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
];

const account: Account = { address: accountAddress, type: "json-rpc" };

interface RpcCall {
  method: string;
  params?: readonly [
    { data?: Hex; to?: Address; from?: Address }?,
    ...unknown[],
  ];
}

/**
 * A real viem wallet client over a fake JSON-RPC transport, so the production
 * code runs against the genuine `WalletClient` contract instead of a cast
 * fake. `eth_call` answers `0x`, which also guards the GovernorBravo quirk:
 * castVote returns no data, so an ABI declaring a return value would make
 * simulateContract throw while decoding the empty result.
 */
const makeClient = () => {
  const requests: RpcCall[] = [];
  const request = async ({ method, params }: RpcCall) => {
    requests.push({ method, params });
    switch (method) {
      case "eth_chainId":
        return "0x1";
      case "eth_call":
        return "0x";
      case "eth_sendTransaction":
        return transactionHash;
      case "eth_blockNumber":
        return "0x1";
      case "eth_getTransactionReceipt":
        return {
          transactionHash,
          transactionIndex: "0x0",
          blockHash: `0x${"11".repeat(32)}`,
          blockNumber: "0x1",
          from: accountAddress,
          to: tornGovernor,
          cumulativeGasUsed: "0x5208",
          gasUsed: "0x5208",
          contractAddress: null,
          logs: [],
          logsBloom: `0x${"00".repeat(256)}`,
          status: "0x1",
          effectiveGasPrice: "0x1",
          type: "0x2",
        };
      default:
        throw new Error(`unexpected RPC method ${method}`);
    }
  };
  const walletClient = createWalletClient({
    chain: mainnet,
    transport: custom({ request }),
  });
  const callsTo = (method: string) =>
    requests.filter((entry) => entry.method === method);
  return { walletClient, callsTo };
};

const tornVoteAbi = [
  {
    type: "function",
    name: "castDelegatedVote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address[]" },
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "castVote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "bool" },
    ],
    outputs: [],
  },
] as const;

const governorCastVoteAbi = [
  {
    type: "function",
    name: "castVote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "uint8" },
    ],
    outputs: [],
  },
] as const;

describe("voteOnProposal", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses Tornado Cash castDelegatedVote for voters with delegators", async () => {
    const { walletClient, callsTo } = makeClient();
    const setTransactionhash = jest.fn();

    const receipt = await voteOnProposal(
      "for",
      "42",
      account,
      mainnet,
      DaoIdEnum.TORN,
      walletClient,
      setTransactionhash,
      undefined,
      undefined,
      false,
      delegatorAddresses,
    );

    const expectedData = encodeFunctionData({
      abi: tornVoteAbi,
      functionName: "castDelegatedVote",
      args: [delegatorAddresses, 42n, true],
    });
    expect(callsTo("eth_call")[0]?.params?.[0]).toMatchObject({
      to: tornGovernor,
      data: expectedData,
    });
    expect(callsTo("eth_sendTransaction")[0]?.params?.[0]).toMatchObject({
      data: expectedData,
    });
    expect(receipt?.transactionHash).toBe(transactionHash);
    expect(receipt?.status).toBe("success");
    expect(setTransactionhash).toHaveBeenNthCalledWith(1, transactionHash);
    expect(setTransactionhash).toHaveBeenNthCalledWith(2, "");
  });

  it("uses Tornado Cash castVote when the voter has no delegators", async () => {
    const { walletClient, callsTo } = makeClient();

    const receipt = await voteOnProposal(
      "against",
      "42",
      account,
      mainnet,
      DaoIdEnum.TORN,
      walletClient,
      jest.fn(),
      undefined,
      undefined,
      false,
      [],
    );

    // castDelegatedVote reverts on-chain with "Can not be empty" for an empty
    // `from` list, so a voter without delegators must go through castVote.
    const expectedData = encodeFunctionData({
      abi: tornVoteAbi,
      functionName: "castVote",
      args: [42n, false],
    });
    expect(callsTo("eth_call")[0]?.params?.[0]).toMatchObject({
      to: tornGovernor,
      data: expectedData,
    });
    expect(callsTo("eth_sendTransaction")[0]?.params?.[0]).toMatchObject({
      data: expectedData,
    });
    expect(receipt?.status).toBe("success");
  });

  it("casts governor votes through castVote(uint256,uint8)", async () => {
    const { walletClient, callsTo } = makeClient();

    const receipt = await voteOnProposal(
      "for",
      "98",
      account,
      mainnet,
      DaoIdEnum.UNISWAP,
      walletClient,
      jest.fn(),
    );

    // The fake eth_call answers `0x`; this only decodes (and the vote only
    // succeeds) while the castVote ABI keeps its void return, mirroring the
    // GovernorBravo deployments.
    const expectedData = encodeFunctionData({
      abi: governorCastVoteAbi,
      functionName: "castVote",
      args: [98n, 1],
    });
    expect(callsTo("eth_call")[0]?.params?.[0]).toMatchObject({
      to: uniGovernor,
      data: expectedData,
    });
    expect(receipt?.status).toBe("success");
  });

  it("rejects Tornado Cash abstain votes before sending a transaction", async () => {
    const { walletClient, callsTo } = makeClient();

    const receipt = await voteOnProposal(
      "abstain",
      "42",
      account,
      mainnet,
      DaoIdEnum.TORN,
      walletClient,
      jest.fn(),
    );

    expect(receipt).toBeNull();
    expect(callsTo("eth_call")).toHaveLength(0);
    expect(callsTo("eth_sendTransaction")).toHaveLength(0);
  });
});
