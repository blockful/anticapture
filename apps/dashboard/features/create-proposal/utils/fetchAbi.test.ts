import { fetchAbi } from "@/features/create-proposal/utils/fetchAbi";

const VALID_ADDR = `0x${"a".repeat(40)}`;

describe("fetchAbi", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();
  });

  test("returns null for an invalid address", async () => {
    await expect(fetchAbi(1, "not-an-address")).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("parses a successful response", async () => {
    const abi = [{ type: "function", name: "foo", inputs: [], outputs: [] }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "1",
          message: "OK",
          result: JSON.stringify(abi),
        }),
    });

    await expect(fetchAbi(1, VALID_ADDR)).resolves.toEqual(abi);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/api/etherscan");
    expect(calledUrl).toContain("chainid=1");
    expect(calledUrl).toContain(`address=${VALID_ADDR}`);
    expect(calledUrl).not.toContain("apikey");
  });

  test("returns null when contract is not verified", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "0",
          message: "NOTOK",
          result: "Contract source code not verified",
        }),
    });
    await expect(fetchAbi(1, VALID_ADDR)).resolves.toBeNull();
  });

  test("returns null on non-OK HTTP response", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    await expect(fetchAbi(1, VALID_ADDR)).resolves.toBeNull();
  });

  test("returns null when the result payload is not valid JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ status: "1", message: "OK", result: "not-json" }),
    });
    await expect(fetchAbi(1, VALID_ADDR)).resolves.toBeNull();
  });
});
