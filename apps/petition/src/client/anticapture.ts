import axios, { AxiosInstance } from "axios";

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

  async getSignaturesVotingPower(daoId: string) {
    const response = await this.client.post('', {
      query: `
        query GetVotingPower($daoId: String!) {
          votingPower(daoId: $daoId)
        }
      }`,
      variables: {
        daoId,
      },
    })

    console.log({ response });
    return response.data.data.votingPower;
  }
}
