export const PERCENTAGE_NO_BASELINE = "NO BASELINE";
export const PERIOD_UNBOUND = "UNBOUND";

// Address enrichment (ENS name, contract flag, arkham labels) is stable within
// a session. Without a stale time every avatar refetched on remount, flooding
// the enrichment API whenever a table re-rendered.
export const ADDRESS_ENRICHMENT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const ADDRESS_ENRICHMENT_GC_TIME = 30 * 60 * 1000; // 30 minutes
