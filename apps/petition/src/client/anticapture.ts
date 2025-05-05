import axios, { AxiosInstance } from "axios";
import { Address } from "viem";

export default class GraphqlAnticaptureClient {
  private client: AxiosInstance;

  constructor(apiUrl: string) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getDAOs() {
    // TODO read all DAOs from the API Gateway #704
    return ["ENS", "UNI", "ARB"];
  }

  async getSignersVotingPower(daoId: string, signers: Address[]): Promise<bigint> {
    const { data } = await this.client.post('', {
      query: `
        query getVotingPower($daoId: String!, $signers: [String!]!) {
          getVotingPower(
            accounts: $signers,
            daoId: $daoId
          ) {
            ... on getVotingPower_200_response {
              votingPower
            }
          }
        }
      `,
      variables: {
        daoId,
        signers,
      },
    })
    return BigInt(data.data.getVotingPower.votingPower);
  }
}
