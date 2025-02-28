interface DbConfig {
  url: string;
}

export const getDbConfig = (): DbConfig => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return {
    url: process.env.DATABASE_URL!,
  };
};
