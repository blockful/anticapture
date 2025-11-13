/**
 * GraphQL resolver for DAOs
 * Uses GraphQL Mesh context to fetch DAOs from each DAO's REST API
 * and aggregates them into a list of DAOs
 */
export const daosResolver = {
  resolve: async (root, _args, context) => {
    // Extract REST clients from context
    const restClients = Object.keys(context)
      .filter((key) => key.startsWith('rest_'))
      .map((key) => ({
        daoId: key.replace('rest_', ''),
        client: context[key]?.Query,
      }))
      .filter(
        ({ client }) => client && typeof client.dao === 'function'
      );

    // Fetch from all DAOs in parallel
    const results = await Promise.allSettled(
      restClients.map(({ daoId, client }) =>
        client.dao({
          root,
          context,
          selectionSet: `
            {
              id
              chainId
              quorum
              proposalThreshold
              votingDelay
              votingPeriod
              timelockDelay
            }
          `,
        })
        .then((response) => ({
          daoId,
          response,
        }))
      )
    );

    // Extract successful responses
    const items = results
      .filter((result): result is PromiseFulfilledResult<any> =>
        result.status === 'fulfilled' && result.value.response
      )
      .map(result => result.value.response);

    return {
      items,
      totalCount: items.length,
    };
  },
};