import { BigNumber } from "@ethersproject/bignumber";
import { arrayify, hexlify } from "@ethersproject/bytes";
import { randomBytes } from "@ethersproject/random";
import { formatBytes32String, toUtf8Bytes } from "@ethersproject/strings";

// Snapshot mainnet Shutter EON public key (public value, not a secret).
// Source: snapshot-labs/snapshot VITE_SHUTTER_EON_PUBKEY.
const DEFAULT_EON_PUBLIC_KEY =
  "0x0e6493bbb4ee8b19aa9b70367685049ff01dc9382c46aed83f8bc07d2a5ba3e6030bd83b942c1fd3dff5b79bef3b40bf6b666e51e7f0be14ed62daaffad47435265f5c9403b1a801921981f7d8659a9bd91fe92fb1cf9afdb16178a532adfaf51a237103874bb03afafe9cab2118dae1be5f08a0a28bf488c1581e9db4bc23ca";

const EON_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SHUTTER_EON_PUBKEY ?? DEFAULT_EON_PUBLIC_KEY;

// Vendored from @shutter-network/shutter-crypto@1.0.1 dist into public/.
const WASM_URL = "/shutter-crypto.wasm";

// Lazily import the crypto module (keeps the 330KB WASM out of the initial
// bundle) and initialize it. The dynamic import is a value expression, so the
// 330KB module is not pulled into the initial bundle.
async function importAndInit() {
  const mod = await import("@shutter-network/shutter-crypto");
  await mod.init(WASM_URL);
  return mod;
}

let cryptoPromise: ReturnType<typeof importAndInit> | null = null;

// Memoize so the import + init happens exactly once. Reset on failure so a
// transient error can be retried on the next vote attempt.
function loadCrypto() {
  if (!cryptoPromise) {
    cryptoPromise = importAndInit().catch((err) => {
      cryptoPromise = null;
      throw err;
    });
  }
  return cryptoPromise;
}

/**
 * Encrypt a vote choice for a Shutter-privacy Snapshot proposal. Mirrors
 * snapshot's encryptChoice: the choice is JSON-stringified by the caller and
 * passed here as a UTF-8 string; returns the hex string the sequencer requires
 * (it rejects non-encrypted choices on shutter proposals as "invalid choice").
 */
export async function encryptChoice(
  choice: string,
  proposalId: string,
): Promise<string> {
  const { encrypt } = await loadCrypto();

  const message = arrayify(toUtf8Bytes(choice));
  const eonPublicKey = arrayify(EON_PUBLIC_KEY);
  const proposalIdBytes = arrayify(
    proposalId.startsWith("0x") ? proposalId : formatBytes32String(proposalId),
  );
  const sigma = arrayify(BigNumber.from(randomBytes(32)));

  const encrypted = await encrypt(
    message,
    eonPublicKey,
    proposalIdBytes,
    sigma,
  );
  return hexlify(encrypted);
}
