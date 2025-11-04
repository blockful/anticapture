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
  "token",
  "votingPowerVariations",
  "accountBalanceVariations",
  "delegationPercentageByDay",
  "dao",
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
      if (!targetClient) {
        throw new Error(
          `DAO "${daoId}" is not configured. Please set DAO_API_${daoId.toUpperCase()} environment variable.`
        );
      }

      if (typeof targetClient[fieldName] !== "function") {
        throw new Error(
          `Endpoint "${fieldName}" is not available for DAO "${daoId}". The DAO API may not support this query.`
        );
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
