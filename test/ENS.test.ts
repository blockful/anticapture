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

describe("ENS Tests", () => {
  const ENSGovernorContract = getContract({
    abi: ENSGovernorAbi,
    client,
    address: config.ponder.test.contracts.ENSGovernor?.address as `0x${string}`,
  });
  const ENSTokenContract = getContract({
    abi: ENSTokenAbi,
    client: {
      wallet: client,
      public: client,
    },
    address: config.ponder.test.contracts.ENSToken?.address as `0x${string}`,
  });

  const ENSTimelockControllerContract = getContract({
    abi: ENSTimelockControllerAbi,
    client: {
      wallet: client,
      public: client,
    },
    address: testContracts.ENSTimelockController.address as Address,
  });

  let proposalDescription: string;

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
      const proposerRoleKeccak256 =
        "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
      const revokeRoleData = encodeFunctionData({
        abi: ENSTimelockControllerAbi,
        functionName: "revokeRole",
        args: [proposerRoleKeccak256, addressToBeRevoked],
      });

      proposalDescription = "Revoke Role 20";

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
      // const proposalIdInTimelock = await getProposalIdInTimelock(
      //   client,
      //   userAddress,
      //   proposal,
      //   proposalDescription
      // );
      await testClient.mine({ blocks: 10 });
      // const isReady = await isOperationReady(client, proposalIdInTimelock);
      // if (!isReady) {
      //   throw new Error("Operation is not Ready");
      // }
      await executeProposal(client, userAddress, proposal, proposalDescription);
      // const isDone = await isOperationDone(client, proposalIdInTimelock);
      // if (!isDone) {
      //   throw new Error("Operation is not Done");
      // }
      await delay(10000);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });

  describe("Ponder: Check Account Registration", () => {
    let id: Address, ENSVotingPower: string;
    beforeAll(async () => {
      let { rows } = await pgClient.query('select * from public."Account" a ;');
      ({ id, ENSVotingPower } = rows[1]); // [0] is the Token contract
    });
    test("Registered user address", () => {
      expect(id.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
    test("Registered user voting power", () => {
      expect(ENSVotingPower).toBe("100000000000000000000");
    });
  });

  describe("Ponder: Check Delegations Registration", () => {
    let delegator: Address, delegatee: Address;
    beforeAll(async () => {
      let { rows } = await pgClient.query(
        'select * from public."Delegations" d ;'
      );
      ({ delegator, delegatee } = rows[0]);
    });
    test("Registered Delegator", () => {
      expect(delegator.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
    test("Registered Delegatee", () => {
      expect(delegatee.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
  });
  describe("Ponder: Check ProposalsOnChain Registration", () => {
    let dao: string, proposer: Address, description: string, targets: Address[];
    beforeAll(async () => {
      let { rows } = await pgClient.query(
        'select * from public."ProposalsOnchain" p ;'
      );
      ({ dao, proposer, description, targets } = rows[0]);
    });
    test("Registered DAO", () => {
      expect(dao).toBe("ENS");
    });
    test("Registered Proposer", () => {
      expect(proposer.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
    test("Registered Description", () => {
      expect(description).toBe(proposalDescription);
    });
    test("Registered Targets", () => {
      expect(targets[0]?.toLocaleLowerCase()).toBe(
        ENSTimelockControllerContract.address.toLocaleLowerCase()
      );
    });
  });
  describe("Ponder: Check Transfers Registration", () => {
    let amount: Address, to: Address;
    beforeAll(async () => {
      let { rows } = await pgClient.query(
        'select * from public."Transfers" t ;'
      );
      ({ amount, to } = rows[0]);
    });
    test("Registered Amount", () => {
      expect(amount).toBe(`${100e18}`);
    });
    test("Registered To", () => {
      expect(to.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
  });
  describe("Ponder: Check Votes On Chain Registration", () => {
    let voter: Address, weight: Address;
    beforeAll(async () => {
      let { rows } = await pgClient.query(
        'select * from public."VotesOnchain" v ;'
      );
      ({ voter, weight } = rows[0]);
    });
    test("Registered Voter", () => {
      expect(voter.toLowerCase()).toBe(userAddress.toLocaleLowerCase());
    });
    test("Registered Weight", () => {
      expect(weight.toLowerCase()).toBe(`${100e18}`);
    });
  });
});
