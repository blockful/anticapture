import { Account, Address, Chain, Client, Transport } from "viem";
import { DaoIdEnum } from "./enums";
import { GovernorAbiType } from "@/indexer/types";
import { getBlockNumber, readContract } from "viem/actions";

export function newGovernorClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>(
  client: Client<TTransport, TChain, TAccount>,
  abi: GovernorAbiType,
  address: Address,
) {
  const getQuorum = async (daoId: DaoIdEnum) => {
    switch (daoId) {
      case DaoIdEnum.UNI:
        return readContract(client, {
          abi,
          address,
          functionName: "quorumVotes",
        });
      case DaoIdEnum.ENS:
        const blockNumber = await getBlockNumber(client);
        return readContract(client, {
          abi,
          address,
          functionName: "quorum",
          args: [blockNumber - 10n],
        });
    }
  };

  async function getProposalThreshold() {
    return readContract(client, {
      abi,
      address,
      functionName: "proposalThreshold",
    });
  }

  async function getVotingDelay() {
    return readContract(client, {
      abi,
      address,
      functionName: "votingDelay",
    });
  }

  async function getVotingPeriod() {
    return readContract(client, {
      abi,
      address,
      functionName: "votingPeriod",
    });
  }

  const getTimelockDelay = async (daoId: DaoIdEnum): Promise<bigint> => {
    const timelockAbis = {
      [DaoIdEnum.UNI]: {
        constant: true,
        inputs: [],
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
        name: "delay",
      },
      [DaoIdEnum.ENS]: {
        constant: true,
        inputs: [],
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
        name: "getMinDelay",
      },
    } as const;

    const timelockAddress = await readContract(client, {
      abi,
      address,
      functionName: "timelock",
    });
    return readContract(client, {
      abi: [timelockAbis[daoId as DaoIdEnum.UNI | DaoIdEnum.ENS]],
      address: timelockAddress,
      functionName: timelockAbis[daoId as DaoIdEnum.UNI | DaoIdEnum.ENS].name,
    });
  };

  return {
    getVotingDelay,
    getVotingPeriod,
    getTimelockDelay,
    getQuorum,
    getProposalThreshold,
  };
}
