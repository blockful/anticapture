import { defineConfig } from 'drizzle-kit';

import { env } from './src/config';

export default defineConfig({
  out: './drizzle',
  schema: './src/repositories/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});