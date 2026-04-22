import {
  Address,
  createWalletClient,
  Hash,
  Hex,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Chain } from "viem";

import { RelayerSigner } from "./types";

export function createLocalSigner(
  privateKey: Hex,
  chain: Chain,
  rpcUrl: string,
): RelayerSigner {
  const account = privateKeyToAccount(privateKey);

  const client = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }).extend(publicActions);

  return {
    address: account.address,

    async sendTransaction(tx: {
      to: Address;
      data: Hex;
      value: bigint;
    }): Promise<Hash> {
      return client.sendTransaction(tx);
    },
  };
}
