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
  orderDirection?: string
): bigint {
  if (items.length === 0) throw new Error('No items to get first date from');
  const firstItem =
    orderDirection === 'desc' ? items[items.length - 1] : items[0];
  return BigInt(firstItem.date);
}

/**
 * Aligns DAO responses to ensure all DAOs have data in the same date range
 * Returns filtered responses where all DAOs have overlapping data
 */
export function alignDaoResponses(
  daoResponses: Map<string, DelegationPercentageResponse>,
  orderDirection?: string
): Map<string, DelegationPercentageResponse> {
  // Filter out DAOs with no data
  const daoResponsesWithData = Array.from(daoResponses.entries()).filter(
    ([_, response]) => response?.items?.length > 0
  );

  if (daoResponsesWithData.length === 0) {
    return new Map();
  }

  // Find the effective start date (maximum of all first dates)
  // This ensures all DAOs have data from this point forward
  const firstDates = daoResponsesWithData.map(([_, response]) =>
    getFirstDate(response.items, orderDirection)
  );
  const effectiveStartDate = firstDates.reduce((max, date) =>
    date > max ? date : max
  );

  // Filter items from each DAO to start at effectiveStartDate
  const alignedResponses = new Map(
    daoResponsesWithData.map(([dao, response]) => [
      dao,
      {
        ...response,
        items: response.items.filter(
          (item) => BigInt(item.date) >= effectiveStartDate
        ),
      },
    ])
  );

  return alignedResponses;
}

/**
 * Aggregates delegation percentages across DAOs using mean calculation
 * Returns high as the mean percentage string with 2 decimal places (e.g., "11.74")
 * Assumes all DAOs have the same dates after alignment (via alignDaoResponses)
 * This is guaranteed because indexers return consecutive daily data via forward-fill
 * Complexity: O(m × n) where m is number of items and n is number of DAOs
 */
export function aggregateMeanPercentage(
  daoResponses: Map<string, DelegationPercentageResponse>
): { date: string; high: string }[] {
  const daoResponsesArray = Array.from(daoResponses.values());

  // Handle empty case
  if (daoResponsesArray.length === 0) {
    return [];
  }

  // Use first DAO as reference (all DAOs have same dates after alignment)
  const referenceDao = daoResponsesArray[0];

  if (!referenceDao || referenceDao.items.length === 0) {
    return [];
  }

  // For each index, calculate mean across all DAOs
  return referenceDao.items.map((_, index) => {
    const percentages = daoResponsesArray.map((response) => {
      const item = response.items[index];
      // Values are strings in percentage format (e.g., "11.74")
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
 * Extracts REST clients, fetches data, and returns successful responses
 * Combines client extraction + fetching + result processing
 */
export async function fetchAndExtractDaoData(
  context: any,
  queryArgs: any,
  root: any
): Promise<Map<string, DelegationPercentageResponse>> {
  // Extract REST clients from context
  const restClients = Object.keys(context)
    .filter((key) => key.startsWith('rest_'))
    .map((key) => ({
      daoId: key.replace('rest_', ''),
      client: context[key]?.Query,
    }))
    .filter(
      ({ client }) =>
        client && typeof client.delegationPercentageByDay === 'function'
    );

  // Fetch from all DAOs in parallel
  const results = await Promise.allSettled(
    restClients.map(({ daoId, client }) =>
      client
        .delegationPercentageByDay({
          root,
          args: queryArgs,
          context,
          selectionSet: `
            {
              items {
                date
                high
              }
              pageInfo {
                hasNextPage
                endDate
                startDate
              }
            }
          `,
        })
        .then((response: DelegationPercentageResponse) => ({
          daoId,
          response,
        }))
    )
  );

  // Extract successful responses
  const daoResponses = new Map<string,
  DelegationPercentageResponse>();
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.response) {
      daoResponses.set(result.value.daoId, result.value.response);
    }
  });

  return daoResponses;
}

/**
 * Calculates hasPreviousPage based on whether user has paginated forward
 * Logic: hasPreviousPage = true when 'after' is used AND after !== startDate
 */
function calculateHasPreviousPage(
  args: {
    startDate?: string;
    after?: string;
  }
): boolean {
  return !!(args.after && args.startDate && args.after !== args.startDate);
}

/**
 * Applies pagination and builds complete response
 * Handles empty items case
 */
export function buildPaginatedResponse(
  items: { date: string; high: string }[],
  args: {
    limit?: number;
    after?: string;
    before?: string;
    orderDirection?: string;
    startDate?: string;
  },
  hasNextPageFromDaos: boolean
): DelegationPercentageResponse {
  // Handle empty case
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

  // Apply limit if specified
  const userLimit = args.limit || 100;
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
      endDate:
        finalItems.length > 0 ? finalItems[finalItems.length - 1].date : null,
      startDate: finalItems.length > 0 ? finalItems[0].date : null,
    },
  };
}

// === RESOLVER ===

/**
 * GraphQL resolver for average delegation percentage across all DAOs
 * Uses GraphQL Mesh context to fetch delegation percentage from each DAO's REST API
 * and aggregates them into a mean delegation percentage time series by day
 */
export const averageDelegationPercentageByDayResolver = {
  resolve: async (root: any, args: any, context: any, info: any) => {
    if (
      args.startDate &&
      args.endDate &&
      BigInt(args.startDate) >= BigInt(args.endDate)
    ) {
      throw new Error('startDate must be before endDate');
    }

    // Fetch data from all DAOs
    const daoResponses = await fetchAndExtractDaoData(context, args, root);

    // Check if any DAO has more data (hasNextPage)
    const hasNextPage = Array.from(daoResponses.values()).some(
      (response) => response?.pageInfo?.hasNextPage ?? false
    );

    // Align DAO responses to ensure all DAOs have data in the same range
    const alignedResponses = alignDaoResponses(
      daoResponses,
      args.orderDirection
    );

    // Aggregate and return paginated result
    const aggregated =
      alignedResponses.size === 0
        ? []
        : aggregateMeanPercentage(alignedResponses);

    return buildPaginatedResponse(aggregated, args, hasNextPage);
  },
};

