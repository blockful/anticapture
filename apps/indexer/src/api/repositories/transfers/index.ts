import { db } from "ponder:api";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { transfer } from "ponder:schema";

import { DBTransfer, TransfersRequest } from "@/api/mappers";

export class TransfersRepository {
  async getTransfers(req: TransfersRequest): Promise<DBTransfer[]> {
    const sortBy =
      req.sortBy === "timestamp" ? transfer.timestamp : transfer.amount;
    const orderBy = req.sortOrder === "desc" ? desc(sortBy) : asc(sortBy);

    const addressQuery = this.buildAddressQuery(req);
    if (!addressQuery) return [];

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

  /**
   * Builds the address filtering query for transfers.
   *
   * The complexity in this method stems from the requirement that req.address must
   * always be involved in the transfer, even when specific from/to addresses are provided.
   *
   * Query logic:
   * - If both from and to are specified: validates that req.address matches one of them,
   *   then filters for transfers between those specific addresses
   * - If only from is specified: filters transfers from that address (implicitly involving req.address)
   * - If only to is specified: filters transfers to that address (implicitly involving req.address)
   * - Default case: filters all transfers where req.address is either sender or receiver
   *
   * @returns The address filter query, or null if the request is invalid (req.address not involved)
   */
  private buildAddressQuery(req: TransfersRequest) {
    if (req.from && req.to) {
      if (req.from !== req.address && req.to !== req.address) {
        // this would lead to transfers completely unrelated to the drawer's address
        return null;
      }
      return and(
        eq(transfer.fromAccountId, req.from),
        eq(transfer.toAccountId, req.to),
      );
    }

    if (req.from) {
      return eq(transfer.fromAccountId, req.from);
    }

    if (req.to) {
      return eq(transfer.toAccountId, req.to);
    }

    return or(
      eq(transfer.fromAccountId, req.address),
      eq(transfer.toAccountId, req.address),
    );
  }
}
