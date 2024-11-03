import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { GET_DAO_QUERY } from 'src/graphql/queries';

@Injectable()
export class DaoService {
  private readonly graphqlEndpoint =
    'https://gov-indexer-production.up.railway.app/';

  constructor(private configService: ConfigService) {}

  async validateDaoExists(daoId: string): Promise<boolean> {
    try {
      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_DAO_QUERY,
          variables: { id: daoId },
        }),
      });

      const data = await response.json();
      return !!data?.data?.dao;
    } catch (error) {
      console.error('Error fetching DAO:', error);
      return false;
    }
  }
}
