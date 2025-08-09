import { Chain, Account, Transport, Client } from "viem";

import { DaoIdEnum } from "./enums";
import { CONTRACT_ADDRESSES } from "./constants";
import { UNIClient } from "@/indexer/uni/client";
import { ENSClient } from "@/indexer/ens/client";
import { OPClient } from "@/indexer/op";
import { DAOClient } from "@/interfaces/client";
import { ARBClient } from "@/indexer/arb";

export function getGovernor<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>(
  daoId: DaoIdEnum,
  client: Client<TTransport, TChain, TAccount>,
): DAOClient | null {
  const { governor } = CONTRACT_ADDRESSES[daoId];
  switch (daoId) {
    case DaoIdEnum.ENS: {
      return new ENSClient(client, governor.address);
    }
    case DaoIdEnum.UNI: {
      return new UNIClient(client, governor.address);
    }
    case DaoIdEnum.OP: {
      return new OPClient(client, governor.address);
    }
    case DaoIdEnum.ARB: {
      return new ARBClient(client, governor.address);
    }
    default:
      return null;
  }
}
