import { Chain, Account, Transport, Client } from "viem";

import { DaoIdEnum } from "./enums";
import { CONTRACT_ADDRESSES } from "./constants";
import { UNIClient } from "@/indexer/uni/client";
import { ENSClient } from "@/indexer/ens/client";
import { OPClient } from "@/indexer/op";
import { DAOClient } from "@/interfaces/client";
import { GTCClient } from "@/indexer/gtc/client";
import { Client as NounsClient } from "@/indexer/nouns/client";
import { SCRClient } from "@/indexer/scr";
import { ObolClient } from "@/indexer/obol/client";

export function getClient<
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
      return new ENSClient(client, governor.address);
    }
    case DaoIdEnum.UNI: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new UNIClient(client, governor.address);
    }
    case DaoIdEnum.OP: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new OPClient(client, governor.address);
    }
    case DaoIdEnum.TEST: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new ENSClient(client, governor.address);
    }
    case DaoIdEnum.GTC: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new GTCClient(client, governor.address);
    }
    case DaoIdEnum.NOUNS: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new NounsClient(client, governor.address);
    }
    case DaoIdEnum.SCR: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new SCRClient(client, governor.address);
    }
    case DaoIdEnum.OBOL: {
      const { governor } = CONTRACT_ADDRESSES[daoId];
      return new ObolClient(client, governor.address);
    }
    default:
      return null;
  }
}
