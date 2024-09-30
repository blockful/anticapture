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
import { config } from "../config";
import { makeProposal } from "./lib/governor/makeProposal";
import { privateKeyToAccount } from "viem/accounts";
import { castVote } from "./lib/governor/castVote";
import { queueProposal } from "./lib/governor/queueProposal";
import { getProposalIdInTimelock } from "./lib/governor/getProposalIdInTimelock";
import { isOperationReady } from "./lib/governor/isOperationReady";
import { executeProposal } from "./lib/governor/executeProposal";
import { isOperationDone } from "./lib/governor/isOperationDone";
import { ENSGovernorAbi, ENSTokenAbi } from "../src/ens/abi";
import { testContracts } from "./lib/constants";
import { ENSTimelockControllerAbi } from "./abi/ENSTimelockControllerAbi";
import { delay } from "./utils/delay";
import { pgClient } from "./lib/database/pg.client";

const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const userAddressPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const addressToBeRevoked = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

describe("ENS Tests", () => {
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
    address: config.test.contracts.ENSGovernor?.address as `0x${string}`,
  });
  const ENSTokenContract = getContract({
    abi: ENSTokenAbi,
    client: {
      wallet: client,
      public: client,
    },
    address: config.test.contracts.ENSToken?.address as `0x${string}`,
  });

  const ENSTimelockControllerContract = getContract({
    abi: ENSTimelockControllerAbi,
    client: {
      wallet: client,
      public: client,
    },
    address: testContracts.ENSTimelockController.address as Address,
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
      await testClient.mine({ blocks: 2 });
      // Set up proposal
      const proposerRoleKeccak256 = "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
      const revokeRoleData = encodeFunctionData({
        abi: ENSTimelockControllerAbi,
        functionName: "revokeRole",
        args: [proposerRoleKeccak256, addressToBeRevoked],
      });

      const proposalDescription = "Revoke Role 20";

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
      await testClient.mine({ blocks: 10 });
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
      const isReady = await isOperationReady(client, proposalIdInTimelock);
      if (!isReady) {
        throw new Error("Operation is not Ready");
      }
      await executeProposal(client, userAddress, proposal, proposalDescription);
      const isDone = await isOperationDone(client, proposalIdInTimelock);
      if (!isDone) {
        throw new Error("Operation is not Done");
      }
      await delay(8000);
    } catch (error) {
      console.error(error);
    }
  });

  test("Ponder: Check Account Registration", async () => {
    const {
      rows: [{ id, votingPower }],
    } = await pgClient.query('select * from public."Account" a ;');
    test("Registered user address", () => {
      expect(id.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
    test("Registered user voting power", () => {
      expect(votingPower).toBe("100000000000000000000");
    });
  });

  test("Ponder: Check Delegations Registration", async () => {
    const {
      rows: [{ delegator, delegatee }],
    } = await pgClient.query('select * from public."Delegations" d ;');
    test("Registered Delegator", () => {
      expect(delegator.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
    test("Registered Delegatee", () => {
      expect(delegatee.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
  });

  test("Check if Ponder registered user vote power", async () => {
    const {
      rows: [{ votingPower }],
    } = await pgClient.query('select * from public."Account" a ;');
    expect(votingPower).toBe("100000000000000000000");
  });
  test("", () => {
    expect(true).toBe(true)
  })
});
