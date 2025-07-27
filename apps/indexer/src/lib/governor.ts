import { Chain, Account, Transport, Client } from "viem";

import { DaoIdEnum } from "./enums";
import { CONTRACT_ADDRESSES } from "./constants";
import { UNIGovernor } from "@/indexer/uni/client";
import { ENSGovernor } from "@/indexer/ens/client";
import { OPGovernor } from "@/indexer/op";
import { DAOClient } from "@/interfaces/client";

export function getGovernor<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>(
  daoId: DaoIdEnum,
  client: Client<TTransport, TChain, TAccount>,
): DAOClient | null {
  switch (daoId) {
    case DaoIdEnum.ENS: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new ENSGovernor(client, governor.address);
    }
    case DaoIdEnum.UNI: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new UNIGovernor(client, governor.address);
    }
    case DaoIdEnum.OP: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new OPGovernor(client, governor.address);
    }
    default:
      return null;
  }
}
