import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import {
  type Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { mainnet } from "viem/chains";
import { z } from "zod";

import { erc20VotesAbi } from "@/abi/token";
import { RelayDelegateResponseSchema } from "@/schemas/relay-delegate";

import {
  TOKEN_ADDRESS,
  RELAYER_ADDRESS,
  TEST_USER_KEY,
  TEST_USER_ADDRESS,
  BROKE_USER_KEY,
  DELEGATEE_ADDRESS,
  WHALE_ADDRESS,
  startAnvil,
  stopAnvil,
  createTestApp,
  createClients,
  signDelegation,
} from "./helpers";

type SuccessBody = z.infer<typeof RelayDelegateResponseSchema>;

describe("POST /relay/delegate", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let rpcUrl: string;
  let testClient: ReturnType<typeof createClients>["testClient"];
  let walletClient: ReturnType<typeof createClients>["walletClient"];
  let snapshotId: Hex;

  beforeAll(async () => {
    // 1. Start Anvil
    rpcUrl = await startAnvil();
    const clients = createClients(rpcUrl);
    testClient = clients.testClient;
    walletClient = clients.walletClient;

    // 2. Fund relayer with 10 ETH
    await testClient.setBalance({
      address: RELAYER_ADDRESS,
      value: parseEther("10"),
    });

    // 3. Impersonate whale, transfer ~10K ENS to test user
    await testClient.impersonateAccount({ address: WHALE_ADDRESS });
    const whaleClient = createWalletClient({
      account: WHALE_ADDRESS,
      transport: http(rpcUrl),
      chain: mainnet,
    });
    const transferHash = await whaleClient.sendTransaction({
      to: TOKEN_ADDRESS,
      data: encodeFunctionData({
        abi: erc20VotesAbi,
        functionName: "transfer",
        args: [TEST_USER_ADDRESS, parseUnits("10000", 18)],
      }),
    });
    await testClient.waitForTransactionReceipt({ hash: transferHash });
    await testClient.mine({ blocks: 1 });

    // 4. Test user self-delegates to activate voting power checkpoints
    const delegateHash = await walletClient.writeContract({
      address: TOKEN_ADDRESS,
      abi: erc20VotesAbi,
      functionName: "delegate",
      args: [TEST_USER_ADDRESS],
    });
    await testClient.waitForTransactionReceipt({ hash: delegateHash });
    await testClient.mine({ blocks: 1 });

    // 5. Create app
    app = await createTestApp(rpcUrl);
  }, 30_000);

  afterAll(async () => {
    await stopAnvil();
  });

  beforeEach(async () => {
    snapshotId = await testClient.snapshot();
  });

  afterEach(async () => {
    await testClient.revert({ id: snapshotId });
  });

  it("should relay a valid delegation and update on-chain delegate", async () => {
    const body = await signDelegation({
      privateKey: TEST_USER_KEY,
      delegatee: DELEGATEE_ADDRESS,
      nonce: 0n,
      expiry: 4102444800n, // year 2099
    });

    const res = await app.request("/relay/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseBody = (await res.json()) as SuccessBody;

    expect(res.status).toBe(200);
    expect(responseBody.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(responseBody.delegator.toLowerCase()).toBe(
      TEST_USER_ADDRESS.toLowerCase(),
    );

    await testClient.waitForTransactionReceipt({
      hash: responseBody.transactionHash,
    });
    const currentDelegate = await testClient.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20VotesAbi,
      functionName: "delegates",
      args: [TEST_USER_ADDRESS],
    });
    expect(currentDelegate.toLowerCase()).toBe(DELEGATEE_ADDRESS.toLowerCase());
  });

  it("should reject delegation from address with insufficient voting power", async () => {
    const body = await signDelegation({
      privateKey: BROKE_USER_KEY,
      delegatee: DELEGATEE_ADDRESS,
      nonce: 0n,
      expiry: 4102444800n,
    });

    const res = await app.request("/relay/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      code: "INSUFFICIENT_VOTING_POWER",
    });
  });

  it("should reject delegation with wrong nonce", async () => {
    const body = await signDelegation({
      privateKey: TEST_USER_KEY,
      delegatee: DELEGATEE_ADDRESS,
      nonce: 999n,
      expiry: 4102444800n,
    });

    const res = await app.request("/relay/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "NONCE_MISMATCH" });
  });

  it("should reject delegation with expired signature", async () => {
    const body = await signDelegation({
      privateKey: TEST_USER_KEY,
      delegatee: DELEGATEE_ADDRESS,
      nonce: 0n,
      expiry: 1577836800n, // Jan 1, 2020
    });

    const res = await app.request("/relay/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "SIGNATURE_EXPIRED" });
  });
});
