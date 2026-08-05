/**
 * The two kinds of address profile a drawer can open. Lives in `shared/`
 * because the feed, the DAO overview and holders-and-delegates all speak it,
 * and features must not import from one another.
 */
export type EntityType = "delegate" | "tokenHolder";
