export const daosResolver = {
  resolve: async (root: any, args: any, context: any, info) => {
    // Get all clients that start with 'graphql_'
    const graphqlClients = Object.keys(context)
      .filter(key => key.startsWith('graphql_'))
      .map(key => context[key]?.Query)
      .filter(Boolean);

    // Collect results from all clients
    const results = await Promise.all(
      graphqlClients.map(client =>
        client.daos({
          root,
          args,
          context,
          info,
        })
      )
    );

    const items = results.map(result => result.items[0])

    return {
      items,
      totalCount: items.length,
    };
  },
};