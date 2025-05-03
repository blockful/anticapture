import { Config, defineConfig } from 'drizzle-kit';

import { env } from './src/config';

let config: Config

switch (env.NODE_ENV) {
  case 'production':
    config = {
      out: './drizzle',
      schema: './src/repositories/schema.ts',
      dialect: 'postgresql',
      dbCredentials: {
        url: env.DATABASE_URL,
      },
    }
    break;
  default:
    config = {
      out: './drizzle',
      schema: './src/repositories/schema.ts',
      dialect: 'sqlite',
    }
}

export default defineConfig(config);