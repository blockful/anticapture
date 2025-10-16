// === TYPES ===

export type DelegationPercentageResponse = {
  items: { date: string; high: string }[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor: string | null;
    startCursor: string | null;
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
    ([_, response]) => response.items.length > 0
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
 * Returns high as the mean percentage in bigint format (18 decimals)
 * Complexity: O(n x d) where n is the number of dates and d is the number of DAOs
 */
export function aggregateMeanPercentage(
  daoResponses: Map<string, DelegationPercentageResponse>
): { date: string; high: string }[] {
  // Build a map: date -> array of percentages from each DAO
  const datePercentages = new Map<string, number[]>();

  daoResponses.forEach((response) => {
    response.items.forEach((item) => {
      if (!datePercentages.has(item.date)) {
        datePercentages.set(item.date, []);
      }
      if (item.high) {
        // Convert from bigint with 18 decimals to percentage (0-100)
        const percentage = Number(BigInt(item.high)) / Number(BigInt(1e18));
        datePercentages.get(item.date)!.push(percentage);
      }
    });
  });

  // Convert to array, calculate means, and sort by date
  return Array.from(datePercentages.entries())
    .map(([date, percentages]) => {
      // If no percentages, return empty high
      const high = percentages.length > 0
        ? BigInt(Math.round((percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * Number(BigInt(1e18)))).toString()
        : "";
      return { date, high };
    })
    .sort((a, b) => Number(BigInt(a.date) - BigInt(b.date)));
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
        client && typeof client.getDelegationPercentage === 'function'
    );

  // Fetch from all DAOs in parallel
  const results = await Promise.allSettled(
    restClients.map(({ daoId, client }) =>
      client
        .getDelegationPercentage({
          root,
          args: queryArgs,
          context,
          selectionSet: `
            {
              items {
                date
                high
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
  const daoResponses = new Map<string, DelegationPercentageResponse>();
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.response) {
      daoResponses.set(result.value.daoId, result.value.response);
    }
  });

  return daoResponses;
}

/**
 * Applies ordering, pagination, and builds complete response
 * Handles empty items case
 */
export function buildPaginatedResponse(
  items: { date: string; high: string }[],
  args: {
    limit?: number;
    after?: string;
    before?: string;
    orderDirection?: string;
  }
): DelegationPercentageResponse {
  // Handle empty case
  if (items.length === 0) {
    return {
      items: [],
      totalCount: 0,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null,
      },
    };
  }

  // Apply ordering
  const ordered =
    args.orderDirection === 'desc' ? [...items].reverse() : items;

  // Apply pagination
  const userLimit = args.limit || 100;
  const hasNextPage = ordered.length > userLimit;
  const finalItems = ordered.slice(0, userLimit);

  return {
    items: finalItems,
    totalCount: finalItems.length,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!args.after || !!args.before,
      endCursor:
        finalItems.length > 0 ? finalItems[finalItems.length - 1].date : null,
      startCursor: finalItems.length > 0 ? finalItems[0].date : null,
    },
  };
}

// === RESOLVER ===

/**
 * GraphQL resolver for aggregated delegated supply across all DAOs
 * Uses GraphQL Mesh context to fetch delegation percentage from each DAO's REST API
 * and aggregates them into a mean delegation percentage time series
 */
export const aggregatedDelegatedSupplyResolver = {
  resolve: async (root: any, args: any, context: any, info: any) => {
    if (
      args.startDate &&
      args.endDate &&
      BigInt(args.startDate) >= BigInt(args.endDate)
    ) {
      throw new Error('startDate must be before endDate');
    }

    // Fetch data from all DAOs
    const userLimit = args.limit || 100;
    const queryArgs = { ...args, limit: userLimit + 1 };
    const daoResponses = await fetchAndExtractDaoData(context, queryArgs, root);

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

    return buildPaginatedResponse(aggregated, args);
  },
};
