const daoItemQueries = [
  "compareActiveSupply",
  "compareAverageTurnout",
  "compareCexSupply",
  "compareCirculatingSupply",
  "compareDelegatedSupply",
  "compareDexSupply",
  "compareLendingSupply",
  "compareProposals",
  "compareTotalSupply",
  "compareTreasury",
  "compareVotes",
  "getTotalAssets",
  "getVotingPower",
  "historicalTokenData",
  "proposalsActivity",
  "historicalBalances",
  "historicalVotingPower",
  "proposals",
  "transactions",
  "lastUpdate",
  "proposal",
  "votingPowers",
  "proposalNonVoters",
  "topAccountBalanceVariations",
];

export const restResolvers = daoItemQueries.reduce((acc, fieldName) => {
  acc[fieldName] = {
    selectionSet: /* GraphQL */ `
      {
        daoId
      }
    `,
    resolve: async (
      root: unknown,
      args: { daoId?: string },
      context: { headers: { "anticapture-dao-id"?: string } },
      info: unknown,
    ) => {
      const daoId = args.daoId || context.headers["anticapture-dao-id"];

      if (!daoId) {
        throw new Error(`Missing where.daoId in query for ${fieldName}`);
      }

      const targetClient = context[`rest_${daoId.toUpperCase()}`]?.Query;
      if (!targetClient || typeof targetClient[fieldName] !== "function") {
        return {};
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
