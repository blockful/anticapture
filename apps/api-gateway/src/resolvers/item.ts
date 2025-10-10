const daoItemQueries = [
  "account",
  "accountBalance",
  "accountPower",
  "dao",
  "daoMetricsDayBucket",
  "delegation",
  "proposalsOnchain",
  "transfer",
  "votesOnchain",
  "votingPowerHistory",
];

export const itemResolvers = daoItemQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        id
      }
    `,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: async (root: any, args: any, context: any, info: any) => {
      const daoId = args.id || context.headers["anticapture-dao-id"];

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`graphql_${daoId.toUpperCase()}`]?.Query;

      if (!targetClient || typeof targetClient[fieldName] !== "function") {
        return {};
      }

      return targetClient[fieldName]({
        root,
        args,
        context,
        info,
      });
    },
  };

  return acc;
}, {});
