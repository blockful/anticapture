/**
 * GraphQL client for Anticapture API
 * Fetches top token hlders and delegates
 */

export interface DelegateInfo {
  accountId: string;
  votingPower: string;
  delegationsCount: number;
}

export interface TokenHolderInfo {
  address: string;
  balance: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class AnticaptureClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches top delegates by voting power
   */
  async *streamTopDelegates(
    daoId: string,
    pageSize: number = 100
  ) {
    const query = `
    query GetTopDelegates(
      $limit: PositiveInt!,
      $skip: NonNegativeInt!,
    ) {
      votingPowers(
        orderDirection: desc
        limit: $limit
        skip: $skip
        fromValue: "0"
      ) {
        items {
          accountId
          votingPower
          delegationsCount
        }
      }
    }
  `;

    let skip = 0;

    while (true) {
      const response = await this.executeQuery<{
        votingPowers: { items: DelegateInfo[] };
      }>(
        query,
        {
          limit: pageSize,
          skip,
        },
        daoId
      );

      const items = response.votingPowers.items;

      if (items.length === 0) return;

      for (const item of items) {
        yield item;
      }

      if (items.length < pageSize) return;

      skip += pageSize;
    }
  }

  /**
   * Streams top token holders by balance using offset pagination
   */
  async *streamTopTokenHolders(
    daoId: string,
    pageSize: number = 100
  ) {
    const query = `
    query GetTopTokenHolders(
      $limit: PositiveInt!,
      $skip: NonNegativeInt!,
    ) {
      accountBalances(
        orderDirection: desc
        limit: $limit
        skip: $skip
        fromValue: "0"
      ) {
        items {
          address
          balance
        }
      }
    }
  `;

    let skip = 0;

    while (true) {
      const response = await this.executeQuery<{
        accountBalances: { items: TokenHolderInfo[] };
      }>(
        query,
        {
          limit: pageSize,
          skip,
        },
        daoId
      );

      const items = response.accountBalances.items;

      if (items.length === 0) return;

      for (const item of items) {
        yield item;
      }

      if (items.length < pageSize) return;

      skip += pageSize;
    }
  }

  private async executeQuery<T>(
    query: string,
    variables: Record<string, unknown>,
    daoId: string,
  ): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anticapture-dao-id": daoId,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(
        `Anticapture API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = (await response.json()) as GraphQLResponse<T>;

    if (result.errors?.length) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`,
      );
    }

    if (!result.data) {
      throw new Error("No data returned from Anticapture API");
    }

    return result.data;
  }
}
