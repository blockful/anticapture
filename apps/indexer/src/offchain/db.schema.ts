import { Table, is, relations } from "drizzle-orm";
import * as _ponderSchema from "../../ponder.schema";
import * as offchainSchema from "./offchain.schema";
import { TableConfig } from "drizzle-orm/pg-core";

// Note: We need a separate file for merging the schemas because
// "ponder.schema" can't be executed by drizzle-kit, and we also
// don't want drizzle to generate migrations for onchain tables.

// Note: `_ponderSchema` doesn't have information about which database schema
// to use, so we need to set it manually.

const setDatabaseSchema = <T extends { [name: string]: unknown }>(
  schema: T,
  schemaName: string,
): T => {
  for (const table of Object.values(schema)) {
    if (is(table, Table)) {
      (table as Table<TableConfig> & { [key: symbol]: string })[
        Symbol.for("drizzle:Schema")
      ] = schemaName;
    }
  }
  return schema;
};

const ponderSchema = setDatabaseSchema(_ponderSchema, "public");

export const offchainRelations = relations(
  offchainSchema.petitionSignatures,
  ({ one }) => ({
    account: one(ponderSchema.account, {
      fields: [offchainSchema.petitionSignatures.accountId],
      references: [ponderSchema.account.id],
    }),
    dao: one(ponderSchema.dao, {
      fields: [offchainSchema.petitionSignatures.daoId],
      references: [ponderSchema.dao.id],
    }),
  }),
);

export const schema = {
  ...offchainSchema,
  ...ponderSchema,
  offchainRelations,
};
