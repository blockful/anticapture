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
    // const response = await this.client.post('', {
    //   query: `
    //     query GetDAOs {
    //       daos {
    //         items {
    //           id
    //         }
    //       }
    //     }
    //   `,
    // });

    // console.log({ response })

    return ["ENS", "UNI", "ARB"];
  }

  async getSignersVotingPower(daoId: string, signers: Address[]) {
    const response = await this.client.post('', {
      query: `
        query MyQuery {
          getVotingPower(
            accounts: $signers,
            daoId: $daoId
          ) {
            ... on getVotingPower_200_response {
              votingPower
            }
          }
        }
      }`,
      variables: {
        daoId,
        signers,
      },
    })

    console.log({ response })

    return response.data.votingPower;
  }
}
