import { Address, Hash, Hex } from "viem";

export interface RelayerSigner {
  /** The Ethereum address of this signer */
  getAddress(): Promise<Address>;

  /**
   * Send a raw transaction to the network.
   * The implementation handles nonce, gas estimation, and signing.
   */
  sendTransaction(tx: {
    to: Address;
    data: Hex;
    value?: bigint;
  }): Promise<Hash>;
}
