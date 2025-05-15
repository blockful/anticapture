const daoItemQueries = [
  'compareActiveSupply',
  'compareAverageTurnout',
  'compareCexSupply',
  'compareCirculatingSupply',
  'compareDelegatedSupply',
  'compareDexSupply',
  'compareLendingSupply',
  'compareProposals',
  'compareTotalSupply',
  'compareTreasury',
  'compareVotes',
  'getTotalAssets',
  'getVotingPower'
];

export const restResolvers = daoItemQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        daoId
      }
    `,
    resolve: async (root: any, args: any, context: any, info) => {
      const { daoId } = args;

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`rest_${daoId.toUpperCase()}`]?.Query;

      if (!targetClient || typeof targetClient[fieldName] !== 'function') {
        return {}
      }

      try {
        return targetClient[fieldName]({
          root,
          args,
          context,
          info,
        });
      } catch (error) {
        return {};
      }
    },
  };

  return acc;
}, {});
