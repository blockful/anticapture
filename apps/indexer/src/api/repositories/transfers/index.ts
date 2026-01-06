import { db } from "ponder:api";
import { asc, desc } from "drizzle-orm";
import { transfer } from "ponder:schema";

import { DBTransfer, TransfersRequest } from "@/api/mappers";

export class TransfersRepository {
  async getTransfers(req: TransfersRequest): Promise<DBTransfer[]> {
    const sortBy =
      req.sortBy === "timestamp" ? transfer.timestamp : transfer.amount;
    const orderBy = req.sortOrder === "desc" ? desc(sortBy) : asc(sortBy);

    return await db.query.transfer.findMany({
      where: (transfer, { eq, gte, lte, and, or }) =>
        and(
          or(
            eq(transfer.fromAccountId, req.from || req.address),
            eq(transfer.toAccountId, req.to || req.address),
          ),
          req.fromDate
            ? gte(transfer.timestamp, BigInt(req.fromDate))
            : undefined,
          req.fromValue ? gte(transfer.amount, req.fromValue) : undefined,
          req.toValue ? lte(transfer.amount, req.toValue) : undefined,
        ),
      limit: req.limit,
      offset: req.offset,
      orderBy,
    });
  }
}
