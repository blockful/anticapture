const daoListQueries = [
  "daoMetricsDayBuckets",
  "votesOnchains",
  "votingPowerHistorys", // FIXME: Leave endpoint active for now as it is still used by the notification bot
];

export const listResolvers = daoListQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        where {
          daoId
        }
      }
    `,
    resolve: async (root: any, args: any, context: any, info) => {
      const daoId = args.where?.daoId || context.headers["anticapture-dao-id"];

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`graphql_${daoId.toUpperCase()}`]?.Query;

      if (!targetClient || typeof targetClient[fieldName] !== "function") {
        return {};
      }

      if (args?.where?.daoId) {
        args.where.daoId = args.where.daoId.toUpperCase();
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
