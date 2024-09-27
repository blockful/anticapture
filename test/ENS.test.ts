import {
  Abi,
  Address,
  createTestClient,
  createWalletClient,
  encodeFunctionData,
  getContract,
  Hex,
  http,
  publicActions,
  walletActions,
} from "viem";
import { anvil } from "viem/chains";
import { ENSGovernorAbi } from "../abis/ENSGovernorAbi";
import { config } from "../config";
import { ENSTokenAbi } from "../abis/ENSTokenAbi";
import { makeProposal } from "./utils/governor/makeProposal";
import { privateKeyToAccount } from "viem/accounts";
import { castVote } from "./utils/governor/castVote";
import { queueProposal } from "./utils/governor/queueProposal";
import { getProposalIdInTimelock } from "./utils/governor/getProposalIdInTimelock";
import { isOperationReady } from "./utils/governor/isOperationReady";
import { executeProposal } from "./utils/governor/executeProposal";
import { isOperationDone } from "./utils/governor/isOperationDone";
import { AccessControlAbi } from "../abis/AccessControlAbi";
import { ENSTimelockControllerAbi } from "../abis/ENSTimelockControllerAbi";

const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const userAddressPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const addressToBeRevoked = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const client = createWalletClient({
  chain: anvil,
  transport: http(),
  account: privateKeyToAccount(userAddressPrivateKey),
})
  .extend(publicActions)
  .extend(walletActions);

const testClient = createTestClient({
  mode: "anvil",
  chain: anvil,
  transport: http(),
});

const ENSGovernorContract = getContract({
  abi: ENSGovernorAbi,
  client,
  address: config.test.contracts.ENSGovernor.address as `0x${string}`,
});
const ENSTokenContract = getContract({
  abi: ENSTokenAbi,
  client: {
    wallet: client,
    public: client,
  },
  address: config.test.contracts.ENSToken.address as `0x${string}`,
});

const ENSTimelockControllerContract = getContract({
  abi: ENSTimelockControllerAbi,
  client: {
    wallet: client,
    public: client,
  },
  address: config.test.contracts.ENSTimelockController.address as `0x${string}`,
});

beforeAll(async () => {
  try {
    const rawData = encodeFunctionData({
      abi: ENSTokenAbi,
      functionName: "delegate",
      args: [userAddress],
    });
    await client.sendTransaction({
      to: ENSTokenContract.address,
      account: userAddress,
      data: rawData,
    });
    await testClient.mine({ blocks: 1 });
    // Set up proposal
    const timelockAddress = config.test.contracts.ENSTimelockController
      .address as Address;
    const proposerRole = await ENSTimelockControllerContract.read.PROPOSER_ROLE();

    const revokeRoleData = encodeFunctionData({
      abi: ENSTimelockControllerAbi,
      functionName: "revokeRole",
      args: [proposerRole, addressToBeRevoked],
    });

    const proposalDescription = "Revoke Role 93";

    const proposal = [
      [ENSTimelockControllerContract.address],
      [0n],
      [revokeRoleData],
    ] as [[Address], [bigint], [Hex]];

    const proposalId = await makeProposal(
      client,
      userAddress,
      proposal,
      proposalDescription
    );
    // Proposal is ready to vote after 2 block because of the revert ERC20Votes: block not yet mined
    await testClient.mine({ blocks: 2 });
    let proposalStatus = await ENSGovernorContract.read.state([proposalId]);
    if (proposalStatus !== 1) {
      throw new Error("Proposal Error: Proposal not initialized");
    }
    // Vote for the proposal
    await castVote(client, userAddress, proposalId);
    // Let the voting end
    await testClient.mine({ blocks: 10 });
    proposalStatus = await ENSGovernorContract.read.state([proposalId]);
    if (proposalStatus !== 4) {
      throw new Error("Proposal Error: Proposal not finished");
    }
    // Queue the proposal to be executed
    await queueProposal(client, userAddress, proposal, proposalDescription);
    proposalStatus = await ENSGovernorContract.read.state([proposalId]);
    if (proposalStatus !== 5) {
      throw new Error("Proposal Error: Proposal not queued");
    }
    const proposalIdInTimelock = await getProposalIdInTimelock(
      client,
      userAddress,
      proposal,
      proposalDescription
    );
    await testClient.mine({ blocks: 10 });
    const isPending =
      await ENSTimelockControllerContract.read.isOperationPending([
        proposalIdInTimelock,
      ]);
    console.log(isPending);
    const isReady = await isOperationReady(client, proposalIdInTimelock);
    if (!isReady) {
      throw new Error("Operation is not Ready");
    }
    await executeProposal(client, userAddress, proposal, proposalDescription);
    const isDone = await isOperationDone(client, proposalIdInTimelock);
    console.log(isDone);
    if (!isDone) {
      throw new Error("Operation is not Done");
    }
  } catch (error) {
    console.error(error);
  }
});

test("Check If User Has Vote Power", async () => {
  const votePower = await ENSTokenContract.read.getVotes([userAddress]);
  expect(votePower).toBeGreaterThan(0n);
});

test("Check if Ponder registered user vote power", async () => {
  
})
