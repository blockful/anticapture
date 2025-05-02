import { Config, defineConfig } from 'drizzle-kit';

import { env } from './src/config';

let baseConfig: Config

switch (env.NODE_ENV) {
  case 'production':
    baseConfig = {
      out: './drizzle',
      schema: './src/repositories/schema.ts',
      dialect: 'postgresql',
      dbCredentials: {
        url: env.DATABASE_URL,
      },
    }
  default:
    baseConfig = {
      out: './drizzle',
      schema: './src/repositories/schema.ts',
      dialect: 'sqlite',
    }
}

export default defineConfig(baseConfig);