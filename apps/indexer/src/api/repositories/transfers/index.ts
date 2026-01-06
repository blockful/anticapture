import { db } from "ponder:api";

import { DBTransfer, TransfersRequest } from "@/api/mappers";

export class TransfersRepository {
  async getTransfers(req: TransfersRequest): Promise<DBTransfer[]> {
    return await db.query.transfer.findMany({
      where: (transfer, { eq, or, gte, lte, and }) =>
        and(
          req.from || req.to
            ? or(
                req.from ? eq(transfer.fromAccountId, req.from) : undefined,
                req.to ? eq(transfer.toAccountId, req.to) : undefined,
              )
            : undefined,
          req.fromDate
            ? gte(transfer.timestamp, BigInt(req.fromDate))
            : undefined,
          req.fromValue ? gte(transfer.amount, req.fromValue) : undefined,
          req.toValue ? lte(transfer.amount, req.toValue) : undefined,
        ),
      limit: req.limit,
      offset: req.offset,
      orderBy: (transfer, { desc }) => [desc(transfer.timestamp)],
    });
  }
}
