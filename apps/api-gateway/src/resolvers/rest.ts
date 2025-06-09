import { convertGraphQLArgs } from '../utils';

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
  'getVotingPower',
  'historicalTokenData',
  'historicalBalances'
];

export const restResolvers = daoItemQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        daoId
      }
    `,
    resolve: async (root: any, args: any, context: any, info) => {
      const daoId = args.daoId || context.headers["anticapture-dao-id"];

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`rest_${daoId.toUpperCase()}`]?.Query;
      if (!targetClient || typeof targetClient[fieldName] !== 'function') {
        return {}
      }

      try {
        // Convert GraphQL arguments to JavaScript values ready to be used as query params
        const convertedArgs = convertGraphQLArgs(args);
        
        return targetClient[fieldName]({
          root,
          args: convertedArgs,
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
