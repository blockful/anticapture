// === TYPES ===

export type DelegationPercentageResponse = {
  items: { date: string; high: string }[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endDate: string | null;
    startDate: string | null;
  };
};

// === HELPERS ===

/**
 * Helper to get the first (oldest) date from items based on order direction
 */
function getFirstDate(
  items: { date: string; high: string }[],
  orderDirection?: string,
): bigint {
  if (items.length === 0) throw new Error("No items to get first date from");
  const firstItem =
    orderDirection === "desc" ? items[items.length - 1] : items[0];
  return BigInt(firstItem.date);
}

/**
 * Aligns DAO responses to ensure all DAOs have data in the same date range.
 * Returns filtered responses where all DAOs have overlapping data.
 */
export function alignDaoResponses(
  daoResponses: Map<string, DelegationPercentageResponse>,
  orderDirection?: string,
): Map<string, DelegationPercentageResponse> {
  const daoResponsesWithData = Array.from(daoResponses.entries()).filter(
    ([, response]) => response?.items?.length > 0,
  );

  if (daoResponsesWithData.length === 0) {
    return new Map();
  }

  const firstDates = daoResponsesWithData.map(([, response]) =>
    getFirstDate(response.items, orderDirection),
  );
  const effectiveStartDate = firstDates.reduce((max, date) =>
    date > max ? date : max,
  );

  return new Map(
    daoResponsesWithData.map(([dao, response]) => [
      dao,
      {
        ...response,
        items: response.items.filter(
          (item) => BigInt(item.date) >= effectiveStartDate,
        ),
      },
    ]),
  );
}

/**
 * Aggregates delegation percentages across DAOs using mean calculation.
 * Returns high as the mean percentage string with 2 decimal places (e.g., "11.74").
 * Assumes all DAOs have the same dates after alignment (via alignDaoResponses).
 */
export function aggregateMeanPercentage(
  daoResponses: Map<string, DelegationPercentageResponse>,
): { date: string; high: string }[] {
  const daoResponsesArray = Array.from(daoResponses.values());

  if (daoResponsesArray.length === 0) {
    return [];
  }

  const referenceDao = daoResponsesArray[0];

  if (!referenceDao || referenceDao.items.length === 0) {
    return [];
  }

  return referenceDao.items.map((_, index) => {
    const percentages = daoResponsesArray.map((response) => {
      const item = response.items[index];
      return parseFloat(item.high);
    });

    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

    return {
      date: referenceDao.items[index].date,
      high: mean.toFixed(2),
    };
  });
}

/**
 * Calculates hasPreviousPage based on whether the user has paginated forward.
 */
function calculateHasPreviousPage(args: {
  startDate?: string;
  after?: string;
}): boolean {
  return !!(args.after && args.startDate && args.after !== args.startDate);
}

/**
 * Applies pagination and builds the complete response.
 */
export function buildPaginatedResponse(
  items: { date: string; high: string }[],
  args: {
    limit?: number | string;
    after?: string;
    before?: string;
    orderDirection?: string;
    startDate?: string;
  },
  hasNextPageFromDaos: boolean,
): DelegationPercentageResponse {
  if (items.length === 0) {
    return {
      items: [],
      totalCount: 0,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endDate: null,
        startDate: null,
      },
    };
  }

  const userLimit = args.limit ? Number(args.limit) : 100;
  const finalItems = items.slice(0, userLimit);

  return {
    items: finalItems,
    totalCount: finalItems.length,
    pageInfo: {
      hasNextPage: hasNextPageFromDaos,
      hasPreviousPage: calculateHasPreviousPage({
        startDate: args.startDate,
        after: args.after,
      }),
      endDate: finalItems.length > 0 ? finalItems[finalItems.length - 1].date : null,
      startDate: finalItems.length > 0 ? finalItems[0].date : null,
    },
  };
}
