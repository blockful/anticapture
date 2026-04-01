// Set required env vars for tests so env.ts validation passes
process.env.RPC_URL = process.env.RPC_URL ?? "http://localhost:8545";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/test";
process.env.DAO_ID = process.env.DAO_ID ?? "UNI";
process.env.CHAIN_ID = process.env.CHAIN_ID ?? "1";
process.env.COINGECKO_API_URL =
  process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";
process.env.COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? "test-key";

// JSON.stringify doesn't handle BigInt natively; this patch ensures it serializes as a string
Object.defineProperty(BigInt.prototype, "toJSON", {
  value: function (this: bigint) {
    return this.toString();
  },
  writable: true,
  configurable: true,
});
