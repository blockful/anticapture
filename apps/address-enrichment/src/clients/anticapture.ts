/**
 * GraphQL client for Anticapture API
 * Fetches top token holders and delegates
 */

export interface DelegateInfo {
  accountId: string;
  votingPower: string;
  delegationsCount: number;
}

export interface TokenHolderInfo {
  accountId: string;
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
  async getTopDelegates(limit: number = 100): Promise<DelegateInfo[]> {
    const query = `
      query GetTopDelegates($limit: Int!) {
        accountPowers(
          orderBy: "votingPower"
          orderDirection: "desc"
          limit: $limit
          where: { votingPower_gt: "0" }
        ) {
          items {
            accountId
            votingPower
            delegationsCount
          }
        }
      }
    `;

    const response = await this.executeQuery<{
      accountPowers: { items: DelegateInfo[] };
    }>(query, { limit });

    return response.accountPowers.items;
  }

  /**
   * Fetches top token holders by balance
   */
  async getTopTokenHolders(limit: number = 100): Promise<TokenHolderInfo[]> {
    const query = `
      query GetTopTokenHolders($limit: Int!) {
        accountBalances(
          orderBy: "balance"
          orderDirection: "desc"
          limit: $limit
          where: { balance_gt: "0" }
        ) {
          items {
            accountId
            balance
          }
        }
      }
    `;

    const response = await this.executeQuery<{
      accountBalances: { items: TokenHolderInfo[] };
    }>(query, { limit });

    return response.accountBalances.items;
  }

  private async executeQuery<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
