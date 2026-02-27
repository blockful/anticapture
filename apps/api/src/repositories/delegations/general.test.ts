import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import * as schema from "@/database/schema";
import { accountBalance, delegation } from "@/database/schema";

import { DelegationsRepository } from "./general";

type DelegationInsert = typeof delegation.$inferInsert;
type AccountBalanceInsert = typeof accountBalance.$inferInsert;

const accountAddress: Address = "0x1234567890123456789012345678901234567890";
const delegatedAccount: Address = "0x2222222222222222222222222222222222222222";

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: "0xdefault",
  daoId: "uni",
  delegateAccountId: accountAddress,
  delegatorAccountId: delegatedAccount,
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const createAccountBalance = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: accountAddress,
  tokenId: "uni",
  balance: 1000n,
  delegate: delegatedAccount,
  ...overrides,
});

const fullDelegation = (overrides: Partial<DelegationInsert> = {}) => ({
  daoId: "uni",
  delegateAccountId: accountAddress,
  delegatorAccountId: delegatedAccount,
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

describe("DelegationsRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DelegationsRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new DelegationsRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(delegation);
    await db.delete(accountBalance);
  });

  describe("getDelegations", () => {
    it("should return undefined when account has no balance row", async () => {
      const result = await repository.getDelegations(accountAddress);
      expect(result).toBeUndefined();
    });

    it("should return undefined when no delegation exists for account delegate", async () => {
      await db.insert(accountBalance).values(createAccountBalance());

      await db.insert(delegation).values(
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
        }),
      );

      const result = await repository.getDelegations(accountAddress);
      expect(result).toBeUndefined();
    });

    it("should return latest delegation for the delegate referenced in account balance", async () => {
      await db.insert(accountBalance).values(createAccountBalance());

      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatedValue: 500n,
          timestamp: 1700001000n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatedValue: 800n,
          timestamp: 1700002000n,
        }),
      ]);

      const result = await repository.getDelegations(accountAddress);

      expect(result).toEqual(
        fullDelegation({
          transactionHash: "0xtx2",
          delegatedValue: 800n,
          timestamp: 1700002000n,
        }),
      );
    });

    it("should use logIndex as secondary sort descending", async () => {
      await db.insert(accountBalance).values(createAccountBalance());

      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          timestamp: 1000n,
          logIndex: 1,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          timestamp: 1000n,
          logIndex: 3,
        }),
      ]);

      const result = await repository.getDelegations(accountAddress);

      expect(result).toEqual(
        fullDelegation({
          transactionHash: "0xtx2",
          timestamp: 1000n,
          logIndex: 3,
        }),
      );
    });

    it("should ignore delegations from other delegator accounts", async () => {
      await db.insert(accountBalance).values(createAccountBalance());

      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: delegatedAccount,
          timestamp: 1000n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 9999n,
        }),
      ]);

      const result = await repository.getDelegations(accountAddress);

      expect(result).toEqual(
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: delegatedAccount,
          timestamp: 1000n,
        }),
      );
    });
  });
});
