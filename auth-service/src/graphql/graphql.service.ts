import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class GraphQLService {
  private readonly endpoint = 'https://gov-indexer-production.up.railway.app/';

  constructor(private configService: ConfigService) {}

  async query(query: string, variables: Record<string, any>) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();
      if (data.errors) {
        console.error('GraphQL Errors:', data.errors);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('GraphQL Query Error:', error);
      return null;
    }
  }
}
