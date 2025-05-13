export default {
  Query: {
    accountPowers: {
      selectionSet: /* GraphQL */ `
        {
          where {
            daoId
          }
        }
      `,
      resolve: async (root, args, context, info) => {
        const daoId = args.where?.daoId;
        return context[`graphql_${daoId}`].Query.accountPowers({
          root,
          args,
          context,
          info,
        });
      }
    }
  }
}

