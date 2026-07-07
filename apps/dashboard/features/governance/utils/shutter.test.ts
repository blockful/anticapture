import { arrayify, hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings";

const init = jest.fn().mockResolvedValue(undefined);
const encrypt = jest.fn();

jest.mock("@shutter-network/shutter-crypto", () => ({
  init: (...args: unknown[]) => init(...args),
  encrypt: (...args: unknown[]) => encrypt(...args),
}));

// Imported after the mock is registered.
import { encryptChoice } from "./shutter";

const PROPOSAL_ID =
  "0xa736ce4411be14ceaab141989ac271ce1ca96aee6d3ac26bb893ec3c898385d0";

describe("encryptChoice", () => {
  beforeEach(() => {
    init.mockClear();
    encrypt.mockReset();
    encrypt.mockResolvedValue(Uint8Array.from([1, 2, 3, 4]));
  });

  it("encrypts the UTF-8 choice string and returns a 0x hex blob", async () => {
    const choice = JSON.stringify([5, 1, 2, 7, 3, 4, 6]);

    const result = await encryptChoice(choice, PROPOSAL_ID);

    expect(result).toBe(hexlify(Uint8Array.from([1, 2, 3, 4])));
    expect(result.startsWith("0x")).toBe(true);

    const [message, eonPublicKey, proposalId, sigma] = encrypt.mock.calls[0];
    expect(Array.from(message)).toEqual(Array.from(toUtf8Bytes(choice)));
    // For a 0x proposal id, bytes are the id itself (32 bytes).
    expect(Array.from(proposalId)).toEqual(Array.from(arrayify(PROPOSAL_ID)));
    expect(proposalId.length).toBe(32);
    expect(eonPublicKey.length).toBeGreaterThan(0);
    expect(sigma.length).toBeGreaterThan(0);
    expect(sigma.length).toBeLessThanOrEqual(32);
  });

  it("formats a non-0x proposal id to bytes32", async () => {
    await encryptChoice("[1]", "my-proposal");
    const [, , proposalId] = encrypt.mock.calls[0];
    expect(proposalId.length).toBe(32);
  });

  it("initializes the wasm once across calls", async () => {
    // Fresh module instance so the memoized init promise starts unset.
    jest.resetModules();
    init.mockClear();
    const { encryptChoice: freshEncryptChoice } = await import("./shutter");

    await freshEncryptChoice("[1]", PROPOSAL_ID);
    await freshEncryptChoice("[2]", PROPOSAL_ID);

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith("/shutter-crypto.wasm");
  });
});
