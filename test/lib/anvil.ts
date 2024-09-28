import { Anvil, createAnvil } from "@viem/anvil";

export class AnvilInstance {
  private readonly forkUrl?: string;
  private readonly blockNumber?: bigint;
  private _anvil?: Anvil;
  private readonly port?: number;

  constructor(forkUrl?: string, blockNumber?: bigint, port?: number) {
    this.forkUrl = forkUrl;
    this.blockNumber = blockNumber;
    this.port = port;
  }

  async startAnvil() {
    if (!!this._anvil) {
      throw new Error("There is already one anvil instance running");
    }
    const anvil = await createAnvil({
      forkBlockNumber: this.blockNumber,
      forkUrl: this.forkUrl,
      port: this.port,
    });
    this._anvil = anvil;
    const hey = await this._anvil.start();
    console.log(hey);
  }

  async stopAnvil() {
    if (!this._anvil) {
      throw new Error("Anvil was not initialized");
    }
    await this._anvil.stop();
  }
}
