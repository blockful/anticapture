import axios, { AxiosInstance } from "axios";
import { Address } from "viem";

export default class GraphqlAnticaptureClient {
  private client: AxiosInstance;

  constructor(apiUrl: string) {
    this.client = axios.create({
      baseURL: apiUrl,
    });
  }

  async getDAOs() {
    const response = await this.client.post('', {
      query: `
        query GetDAOs {
          daos {
            items {
              id
            }
          }
        }
      `,
    });
    console.log({ response });
    return response.data.daos;
  }

  async getSignersVotingPower(daoId: string, signers: Address[]) {
    const response = await this.client.post('', {
      query: `
        query GetVotingPower($daoId: String!, $signers: [String!]!) {
          votingPower(daoId: $daoId, signers: $signers)
        }
      }`,
      variables: {
        daoId,
        signers,
      },
    })

    console.log({ response });
    return response.data.data.votingPower;
  }
}
