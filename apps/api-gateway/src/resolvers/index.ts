import { daosResolver } from "./daos";

const daoItemQueries = [
  'account',
  'accountBalance',
  'accountPower',
  'dao',
  'daoMetricsDayBucket',
  'delegation',
  'proposalsOnchain',
  'token',
  'transfer',
  'votesOnchain',
  'votingPowerHistory',
];

const itemResolvers = daoItemQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        id 
      }
    `,
    resolve: async (root: any, args: any, context: any, info) => {
      const daoId = args.id;

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`graphql_${daoId}`]?.Query;

      if (!targetClient || typeof targetClient[fieldName] !== 'function') {
        throw new Error(`Unsupported daoId "${daoId}" or field "${fieldName}" not found in context`);
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

const daoListQueries = [
  'accountBalances',
  'accountPowers',
  'accounts',
  'daoMetricsDayBuckets',
  'delegations',
  'proposalsOnchains',
  'tokens',
  'transfers',
  'votesOnchains',
  'votingPowerHistorys',
]

const listResolvers = daoListQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        where {
          daoId
        }
      }
    `,
    resolve: async (root: any, args: any, context: any, info) => {
      const daoId = args.where?.daoId;

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`graphql_${daoId}`]?.Query;

      if (!targetClient || typeof targetClient[fieldName] !== 'function') {
        throw new Error(`Unsupported daoId "${daoId}" or field "${fieldName}" not found in context`);
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


export default {
  Query: {
    ...listResolvers,
    ...itemResolvers,
    daos: daosResolver
  }
}

