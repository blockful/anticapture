import { db } from "ponder:api";
import { and, asc, desc, gte, lte } from "drizzle-orm";
import { votesOnchain } from "ponder:schema";

import { DBVote, VotesRequest } from "@/api/mappers";

export class VotesRepository {
  async getVotesCount(req: VotesRequest): Promise<number> {
    return await db.$count(
      votesOnchain,
      and(
        req.fromDate
          ? gte(votesOnchain.timestamp, BigInt(req.fromDate))
          : undefined,
        req.toDate
          ? lte(votesOnchain.timestamp, BigInt(req.toDate))
          : undefined,
      ),
    );
  }

  async getVotes(req: VotesRequest): Promise<DBVote[]> {
    const sortBy =
      req.orderBy === "timestamp"
        ? votesOnchain.timestamp
        : votesOnchain.votingPower;
    const orderBy = req.orderDirection === "desc" ? desc(sortBy) : asc(sortBy);

    return await db.query.votesOnchain.findMany({
      where: (votesOnchain, { gte, lte, and }) =>
        and(
          req.fromDate
            ? gte(votesOnchain.timestamp, BigInt(req.fromDate))
            : undefined,
          req.toDate
            ? lte(votesOnchain.timestamp, BigInt(req.toDate))
            : undefined,
        ),
      limit: req.limit,
      offset: req.skip,
      orderBy,
    });
  }
}
