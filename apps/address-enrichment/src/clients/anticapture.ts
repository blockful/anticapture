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
  address: string;
  balance: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class AnticaptureClient {
  private readonly baseUrl: string;
  private readonly daoId: string;

  constructor(baseUrl: string, daoId: string) {
    this.baseUrl = baseUrl;
    this.daoId = daoId;
  }

  /**
   * Fetches top delegates by voting power
   */
  async getTopDelegates(limit: number = 100): Promise<DelegateInfo[]> {
    const query = `
      query GetTopDelegates($limit: PositiveInt!) {
        votingPowers(
          orderDirection: desc
          limit: $limit
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

    const response = await this.executeQuery<{
      votingPowers: { items: DelegateInfo[] };
    }>(query, { limit });

    return response.votingPowers.items;
  }

  /**
   * Fetches top token holders by balance
   */
  async getTopTokenHolders(limit: number = 100): Promise<TokenHolderInfo[]> {
    const query = `
      query GetTopTokenHolders($limit: PositiveInt!) {
        accountBalances(
          orderDirection: desc
          limit: $limit
          fromValue: "0"
        ) {
          items {
            address
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
        "anticapture-dao-id": this.daoId,
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
