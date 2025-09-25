export const daosResolver = {
  resolve: async (
    root: unknown,
    args: {
      where: {
        id: string;
      };
    },
    context: {
      headers: {
        "anticapture-dao-id": string;
      };
    },
    info: unknown,
  ) => {
    const daoId = args?.where?.id || context.headers["anticapture-dao-id"];

    if (daoId) {
      const graphqlClient = context[`graphql_${daoId.toUpperCase()}`]?.Query;
      return graphqlClient.daos({
        root,
        args,
        context,
        info,
      });
    }

    // Get all clients that start with 'graphql_'
    const graphqlClients = Object.keys(context)
      .filter((key) => key.startsWith("graphql_"))
      .map((key) => context[key]?.Query)
      .filter(Boolean);

    // Collect results from all clients
    const results = await Promise.allSettled(
      graphqlClients.map((client) =>
        client.daos({
          root,
          args,
          context,
          info,
        }),
      ),
    );

    const items = results
      .map(
        (result) => result.status === "fulfilled" && result.value?.items?.[0],
      )
      .filter(Boolean);

    return {
      items,
      totalCount: items.length,
    };
  },
};
