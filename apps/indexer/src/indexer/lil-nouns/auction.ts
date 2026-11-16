import { ponder } from "ponder:registry";
import { tokenPrice } from "ponder:schema";

import { truncateTimestampToMidnight } from "@/lib/date-helpers";

export function LilNounsAuctionIndexer() {
  // Lil Nouns auctions settle many times a day, so the day's row keeps the
  // latest settlement instead of failing on the primary key.
  ponder.on(`LilNounsAuction:AuctionSettled`, async ({ event, context }) => {
    await context.db
      .insert(tokenPrice)
      .values({
        price: event.args.amount,
        timestamp: BigInt(
          truncateTimestampToMidnight(Number(event.block.timestamp)),
        ),
      })
      .onConflictDoUpdate({ price: event.args.amount });
  });
}
