import type { CircuitBreakerRegistry } from "../../shared/circuit-breaker-registry.js";
import { fanOutGet } from "../../shared/fan-out.js";

// TEST: trigger cache
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

export type DelegationResult = DelegationPercentageResponse & {
  cacheControl: string | null;
};

export class DelegationService {
  constructor(
    private readonly daoApis: Map<string, string>,
    private readonly registry: CircuitBreakerRegistry,
  ) {}

  async getAverageDelegationPercentage(args: {
    startDate: string;
    endDate?: string;
    after?: string;
    before?: string;
    orderDirection?: string;
    limit?: number;
  }): Promise<DelegationResult> {
    const params = new URLSearchParams();
    params.set("startDate", args.startDate);
    if (args.endDate) params.set("endDate", args.endDate);
    if (args.after) params.set("after", args.after);
    if (args.before) params.set("before", args.before);
    if (args.orderDirection) params.set("orderDirection", args.orderDirection);
    if (args.limit) params.set("limit", String(args.limit));

    const { data: daoResponses, cacheControl } =
      await fanOutGet<DelegationPercentageResponse>(
        this.daoApis,
        this.registry,
        "/delegation-percentage",
        params.toString(),
      );

    const hasNextPage = Array.from(daoResponses.values()).some(
      (response) => response?.pageInfo?.hasNextPage ?? false,
    );

    const alignedResponses = this.alignDaoResponses(
      daoResponses,
      args.orderDirection,
    );

    const aggregated =
      alignedResponses.size === 0
        ? []
        : this.aggregateMeanPercentage(alignedResponses);

    const paginatedResponse = this.buildPaginatedResponse(
      aggregated,
      args,
      hasNextPage,
    );
    return { ...paginatedResponse, cacheControl };
  }

  private getFirstDate(
    items: { date: string; high: string }[],
    orderDirection?: string,
  ): bigint {
    if (items.length === 0) throw new Error("No items to get first date from");
    const firstItem =
      orderDirection === "desc" ? items[items.length - 1] : items[0];
    return BigInt(firstItem.date);
  }

  private alignDaoResponses(
    daoResponses: Map<string, DelegationPercentageResponse>,
    orderDirection?: string,
  ): Map<string, DelegationPercentageResponse> {
    const daoResponsesWithData = Array.from(daoResponses.entries()).filter(
      ([_, response]) => response?.items?.length > 0,
    );

    if (daoResponsesWithData.length === 0) {
      return new Map();
    }

    const firstDates = daoResponsesWithData.map(([_, response]) =>
      this.getFirstDate(response.items, orderDirection),
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

  private aggregateMeanPercentage(
    daoResponses: Map<string, DelegationPercentageResponse>,
  ): { date: string; high: string }[] {
    const daoResponsesArray = Array.from(daoResponses.values());

    if (daoResponsesArray.length === 0) return [];

    const referenceDao = daoResponsesArray[0];
    if (!referenceDao || referenceDao.items.length === 0) return [];

    return referenceDao.items.map((_, index) => {
      const percentages = daoResponsesArray.map((response) =>
        parseFloat(response.items[index].high),
      );

      const mean =
        percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

      return {
        date: referenceDao.items[index].date,
        high: mean.toFixed(2),
      };
    });
  }

  private calculateHasPreviousPage(args: {
    startDate?: string;
    after?: string;
  }): boolean {
    return !!(args.after && args.startDate && args.after !== args.startDate);
  }

  private buildPaginatedResponse(
    items: { date: string; high: string }[],
    args: {
      limit?: number;
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

    const userLimit = args.limit ?? 100;
    const finalItems = items.slice(0, userLimit);

    return {
      items: finalItems,
      totalCount: finalItems.length,
      pageInfo: {
        hasNextPage: hasNextPageFromDaos || items.length > userLimit,
        hasPreviousPage: this.calculateHasPreviousPage({
          startDate: args.startDate,
          after: args.after,
        }),
        endDate:
          finalItems.length > 0 ? finalItems[finalItems.length - 1].date : null,
        startDate: finalItems.length > 0 ? finalItems[0].date : null,
      },
    };
  }
}
