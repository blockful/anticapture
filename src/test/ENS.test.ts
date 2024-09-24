import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";

const client = createPublicClient({ 
    chain: anvil,
    transport: http()
}) 

test("Check If Token Contract was created", async () => {
    const blockNumber = await client.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(0n);
});
