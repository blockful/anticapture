import { db } from "ponder:api";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { transfer } from "ponder:schema";

import { DBTransfer, TransfersRequest } from "@/api/mappers";

export class TransfersRepository {
  async getTransfers(req: TransfersRequest): Promise<DBTransfer[]> {
    const sortBy =
      req.sortBy === "timestamp" ? transfer.timestamp : transfer.amount;
    const orderBy = req.sortOrder === "desc" ? desc(sortBy) : asc(sortBy);

    let addressQuery = or(
      eq(transfer.fromAccountId, req.address),
      eq(transfer.toAccountId, req.address),
    );

    if (req.from && req.to) {
      if (req.from !== req.address && req.to !== req.address) {
        return [];
      }
      addressQuery = and(
        eq(transfer.fromAccountId, req.from),
        eq(transfer.toAccountId, req.to),
      );
    } else if (req.from) {
      addressQuery = and(eq(transfer.fromAccountId, req.from));
    } else if (req.to) {
      addressQuery = and(eq(transfer.toAccountId, req.to));
    }

    return await db.query.transfer.findMany({
      where: (transfer, { gte, lte, and }) =>
        and(
          addressQuery,
          req.fromDate
            ? gte(transfer.timestamp, BigInt(req.fromDate))
            : undefined,
          req.toDate ? lte(transfer.timestamp, BigInt(req.toDate)) : undefined,
          req.fromValue ? gte(transfer.amount, req.fromValue) : undefined,
          req.toValue ? lte(transfer.amount, req.toValue) : undefined,
        ),
      limit: req.limit,
      offset: req.offset,
      orderBy,
    });
  }
}
