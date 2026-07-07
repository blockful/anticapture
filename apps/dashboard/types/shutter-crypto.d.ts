// @shutter-network/shutter-crypto ships a UMD bundle without type declarations.
declare module "@shutter-network/shutter-crypto" {
  /** Loads the Go WASM module. In the browser, pass a URL to the .wasm file. */
  export function init(wasmUrl?: string): Promise<void>;
  export function encrypt(
    message: Uint8Array,
    eonPublicKey: Uint8Array,
    proposalId: Uint8Array,
    sigma: Uint8Array,
  ): Promise<Uint8Array>;
}
