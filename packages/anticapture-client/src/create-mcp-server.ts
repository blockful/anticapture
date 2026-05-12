/**
 * Factory for the Anticapture MCP server, used by both the stdio and HTTP
 * entrypoints. McpServer only supports one active transport at a time, so the
 * HTTP server needs a fresh instance per session.
 *
 * This is a curated tool set: proposal-related tools are intentionally bound
 * to the /proposals/lean and /offchain/proposals/lean endpoints to keep
 * payloads small for LLM clients. The generated kubb server (generated/mcp/
 * server.ts) exposes every endpoint one-to-one and is no longer used; it
 * remains as a reference for the available handlers and schemas.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

import { accountBalanceByAccountIdHandler } from "../generated/mcp/account-balancesHandlers/accountBalanceByAccountId.ts";
import { accountBalanceVariationsHandler } from "../generated/mcp/account-balancesHandlers/accountBalanceVariations.ts";
import { accountBalanceVariationsByAccountIdHandler } from "../generated/mcp/account-balancesHandlers/accountBalanceVariationsByAccountId.ts";
import { accountBalancesHandler } from "../generated/mcp/account-balancesHandlers/accountBalances.ts";
import { accountInteractionsHandler } from "../generated/mcp/account-balancesHandlers/accountInteractions.ts";
import { historicalBalancesHandler } from "../generated/mcp/account-balancesHandlers/historicalBalances.ts";
import { getAddressHandler } from "../generated/mcp/addressHandlers/getAddress.ts";
import { getAddressesHandler } from "../generated/mcp/addressHandlers/getAddresses.ts";
import { delegationsHandler } from "../generated/mcp/delegationsHandlers/delegations.ts";
import { delegatorsHandler } from "../generated/mcp/delegationsHandlers/delegators.ts";
import { historicalDelegationsHandler } from "../generated/mcp/delegationsHandlers/historicalDelegations.ts";
import { feedEventsHandler } from "../generated/mcp/feedHandlers/feedEvents.ts";
import { getEventRelevanceThresholdHandler } from "../generated/mcp/feedHandlers/getEventRelevanceThreshold.ts";
import { compareActiveSupplyHandler } from "../generated/mcp/governanceHandlers/compareActiveSupply.ts";
import { compareAverageTurnoutHandler } from "../generated/mcp/governanceHandlers/compareAverageTurnout.ts";
import { compareProposalsHandler } from "../generated/mcp/governanceHandlers/compareProposals.ts";
import { compareVotesHandler } from "../generated/mcp/governanceHandlers/compareVotes.ts";
import { daoHandler } from "../generated/mcp/governanceHandlers/dao.ts";
import { delegationPercentageByDayHandler } from "../generated/mcp/metricsHandlers/delegationPercentageByDay.ts";
import { lastUpdateHandler } from "../generated/mcp/metricsHandlers/lastUpdate.ts";
import { tokenMetricsHandler } from "../generated/mcp/metricsHandlers/tokenMetrics.ts";
import { offchainProposalByIdLeanHandler } from "../generated/mcp/offchainHandlers/offchainProposalByIdLean.ts";
import { offchainProposalNonVotersHandler } from "../generated/mcp/offchainHandlers/offchainProposalNonVoters.ts";
import { offchainProposalsLeanHandler } from "../generated/mcp/offchainHandlers/offchainProposalsLean.ts";
import { offchainSearchProposalsLeanHandler } from "../generated/mcp/offchainHandlers/offchainSearchProposalsLean.ts";
import { votesOffchainHandler } from "../generated/mcp/offchainHandlers/votesOffchain.ts";
import { votesOffchainByProposalIdHandler } from "../generated/mcp/offchainHandlers/votesOffchainByProposalId.ts";
import { proposalLeanHandler } from "../generated/mcp/proposalsHandlers/proposalLean.ts";
import { proposalNonVotersHandler } from "../generated/mcp/proposalsHandlers/proposalNonVoters.ts";
import { proposalsLeanHandler } from "../generated/mcp/proposalsHandlers/proposalsLean.ts";
import { proposalsActivityHandler } from "../generated/mcp/proposalsHandlers/proposalsActivity.ts";
import { searchProposalsLeanHandler } from "../generated/mcp/proposalsHandlers/searchProposalsLean.ts";
import { votesByProposalIdHandler } from "../generated/mcp/proposalsHandlers/votesByProposalId.ts";
import { relayDelegateHandler } from "../generated/mcp/relayHandlers/relayDelegate.ts";
import { relayVoteHandler } from "../generated/mcp/relayHandlers/relayVote.ts";
import { healthHandler } from "../generated/mcp/systemHandlers/health.ts";
import { compareCexSupplyHandler } from "../generated/mcp/tokensHandlers/compareCexSupply.ts";
import { compareCirculatingSupplyHandler } from "../generated/mcp/tokensHandlers/compareCirculatingSupply.ts";
import { compareDelegatedSupplyHandler } from "../generated/mcp/tokensHandlers/compareDelegatedSupply.ts";
import { compareDexSupplyHandler } from "../generated/mcp/tokensHandlers/compareDexSupply.ts";
import { compareLendingSupplyHandler } from "../generated/mcp/tokensHandlers/compareLendingSupply.ts";
import { compareTotalSupplyHandler } from "../generated/mcp/tokensHandlers/compareTotalSupply.ts";
import { compareTreasuryHandler } from "../generated/mcp/tokensHandlers/compareTreasury.ts";
import { historicalTokenDataHandler } from "../generated/mcp/tokensHandlers/historicalTokenData.ts";
import { tokenHandler } from "../generated/mcp/tokensHandlers/token.ts";
import { transactionsHandler } from "../generated/mcp/transactionsHandlers/transactions.ts";
import { transfersHandler } from "../generated/mcp/transfersHandlers/transfers.ts";
import { getDaoTokenTreasuryHandler } from "../generated/mcp/treasuryHandlers/getDaoTokenTreasury.ts";
import { getLiquidTreasuryHandler } from "../generated/mcp/treasuryHandlers/getLiquidTreasury.ts";
import { getTotalTreasuryHandler } from "../generated/mcp/treasuryHandlers/getTotalTreasury.ts";
import { averageDelegationPercentageHandler } from "../generated/mcp/undefinedHandlers/averageDelegationPercentage.ts";
import { daosHandler } from "../generated/mcp/undefinedHandlers/daos.ts";
import { gatewayHealthHandler } from "../generated/mcp/undefinedHandlers/gatewayHealth.ts";
import { votesHandler } from "../generated/mcp/votesHandlers/votes.ts";
import { historicalVotingPowerHandler } from "../generated/mcp/voting-powerHandlers/historicalVotingPower.ts";
import { historicalVotingPowerByAccountIdHandler } from "../generated/mcp/voting-powerHandlers/historicalVotingPowerByAccountId.ts";
import { votingPowerByAccountIdHandler } from "../generated/mcp/voting-powerHandlers/votingPowerByAccountId.ts";
import { votingPowerVariationsHandler } from "../generated/mcp/voting-powerHandlers/votingPowerVariations.ts";
import { votingPowerVariationsByAccountIdHandler } from "../generated/mcp/voting-powerHandlers/votingPowerVariationsByAccountId.ts";
import { votingPowersHandler } from "../generated/mcp/voting-powerHandlers/votingPowers.ts";

import {
  accountBalanceByAccountIdQueryParamsSchema,
  accountBalanceByAccountIdQueryResponseSchema,
  accountBalanceVariationsByAccountIdQueryParamsSchema,
  accountBalanceVariationsByAccountIdQueryResponseSchema,
  accountBalanceVariationsQueryParamsSchema,
  accountBalanceVariationsQueryResponseSchema,
  accountBalancesQueryParamsSchema,
  accountBalancesQueryResponseSchema,
  accountInteractionsQueryParamsSchema,
  accountInteractionsQueryResponseSchema,
  compareActiveSupplyQueryParamsSchema,
  compareActiveSupplyQueryResponseSchema,
  compareAverageTurnoutQueryParamsSchema,
  compareAverageTurnoutQueryResponseSchema,
  compareCexSupplyQueryParamsSchema,
  compareCexSupplyQueryResponseSchema,
  compareCirculatingSupplyQueryParamsSchema,
  compareCirculatingSupplyQueryResponseSchema,
  compareDelegatedSupplyQueryParamsSchema,
  compareDelegatedSupplyQueryResponseSchema,
  compareDexSupplyQueryParamsSchema,
  compareDexSupplyQueryResponseSchema,
  compareLendingSupplyQueryParamsSchema,
  compareLendingSupplyQueryResponseSchema,
  compareProposalsQueryParamsSchema,
  compareProposalsQueryResponseSchema,
  compareTotalSupplyQueryParamsSchema,
  compareTotalSupplyQueryResponseSchema,
  compareTreasuryQueryParamsSchema,
  compareTreasuryQueryResponseSchema,
  compareVotesQueryParamsSchema,
  compareVotesQueryResponseSchema,
  daoQueryResponseSchema,
  delegationPercentageByDayQueryParamsSchema,
  delegationPercentageByDayQueryResponseSchema,
  delegationsQueryResponseSchema,
  delegatorsQueryParamsSchema,
  delegatorsQueryResponseSchema,
  feedEventsQueryParamsSchema,
  feedEventsQueryResponseSchema,
  getAddressQueryResponseSchema,
  getAddressesQueryParamsSchema,
  getAddressesQueryResponseSchema,
  averageDelegationPercentageQueryParamsSchema,
  averageDelegationPercentageQueryResponseSchema,
  daosQueryResponseSchema,
  gatewayHealthQueryResponseSchema,
  getDaoTokenTreasuryQueryParamsSchema,
  getDaoTokenTreasuryQueryResponseSchema,
  getEventRelevanceThresholdQueryParamsSchema,
  getEventRelevanceThresholdQueryResponseSchema,
  getLiquidTreasuryQueryParamsSchema,
  getLiquidTreasuryQueryResponseSchema,
  getTotalTreasuryQueryParamsSchema,
  getTotalTreasuryQueryResponseSchema,
  healthQueryResponseSchema,
  historicalBalancesQueryParamsSchema,
  historicalBalancesQueryResponseSchema,
  historicalDelegationsQueryParamsSchema,
  historicalDelegationsQueryResponseSchema,
  historicalTokenDataQueryParamsSchema,
  historicalTokenDataQueryResponseSchema,
  historicalVotingPowerByAccountIdQueryParamsSchema,
  historicalVotingPowerByAccountIdQueryResponseSchema,
  historicalVotingPowerQueryParamsSchema,
  historicalVotingPowerQueryResponseSchema,
  lastUpdateQueryParamsSchema,
  lastUpdateQueryResponseSchema,
  offchainProposalByIdLeanQueryResponseSchema,
  offchainProposalNonVotersQueryParamsSchema,
  offchainProposalNonVotersQueryResponseSchema,
  offchainProposalsLeanQueryParamsSchema,
  offchainProposalsLeanQueryResponseSchema,
  offchainSearchProposalsLeanQueryParamsSchema,
  offchainSearchProposalsLeanQueryResponseSchema,
  proposalLeanQueryResponseSchema,
  proposalNonVotersQueryParamsSchema,
  proposalNonVotersQueryResponseSchema,
  proposalsActivityQueryParamsSchema,
  proposalsActivityQueryResponseSchema,
  proposalsLeanQueryParamsSchema,
  proposalsLeanQueryResponseSchema,
  relayDelegateMutationRequestSchema,
  relayDelegateMutationResponseSchema,
  relayVoteMutationRequestSchema,
  relayVoteMutationResponseSchema,
  searchProposalsLeanQueryParamsSchema,
  searchProposalsLeanQueryResponseSchema,
  tokenMetricsQueryParamsSchema,
  tokenMetricsQueryResponseSchema,
  tokenQueryParamsSchema,
  tokenQueryResponseSchema,
  transactionsQueryParamsSchema,
  transactionsQueryResponseSchema,
  transfersQueryParamsSchema,
  transfersQueryResponseSchema,
  votesByProposalIdQueryParamsSchema,
  votesByProposalIdQueryResponseSchema,
  votesOffchainByProposalIdQueryParamsSchema,
  votesOffchainByProposalIdQueryResponseSchema,
  votesOffchainQueryParamsSchema,
  votesOffchainQueryResponseSchema,
  votesQueryParamsSchema,
  votesQueryResponseSchema,
  votingPowerByAccountIdQueryParamsSchema,
  votingPowerByAccountIdQueryResponseSchema,
  votingPowerVariationsByAccountIdQueryParamsSchema,
  votingPowerVariationsByAccountIdQueryResponseSchema,
  votingPowerVariationsQueryParamsSchema,
  votingPowerVariationsQueryResponseSchema,
  votingPowersQueryParamsSchema,
  votingPowersQueryResponseSchema,
} from "../generated/zod.ts";

const DAO_ALL = [
  "aave",
  "comp",
  "ens",
  "fluid",
  "gtc",
  "lil_nouns",
  "nouns",
  "obol",
  "scr",
  "shu",
  "uni",
] as const;
const DAO_NO_AAVE = [
  "comp",
  "ens",
  "fluid",
  "gtc",
  "lil_nouns",
  "nouns",
  "obol",
  "scr",
  "shu",
  "uni",
] as const;
const DAO_OFFCHAIN = ["comp", "ens", "gtc", "uni"] as const;

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "Anticapture Gateful REST API",
    version: "3.1.0",
  });

  server.registerTool(
    "gatewayHealth",
    {
      title: "Gateway health and per-DAO circuit breaker states",
      description:
        "Returns gateway readiness and the current circuit-breaker state of every configured DAO API.",
      outputSchema: { data: gatewayHealthQueryResponseSchema },
    },
    async () => gatewayHealthHandler(),
  );

  server.registerTool(
    "daos",
    {
      title: "List of all configured DAOs",
      description:
        "Returns governance parameters and feature flags for every configured DAO.",
      outputSchema: { data: daosQueryResponseSchema },
    },
    async () => daosHandler(),
  );

  server.registerTool(
    "averageDelegationPercentage",
    {
      title: "Average delegation percentage across all DAOs",
      description:
        "Returns the average delegation percentage across all configured DAOs for a given time window.",
      outputSchema: {
        data: averageDelegationPercentageQueryResponseSchema,
      },
      inputSchema: {
        params: averageDelegationPercentageQueryParamsSchema,
      },
    },
    async ({ params }) => averageDelegationPercentageHandler({ params }),
  );

  server.registerTool(
    "health",
    {
      title: "Check API and database health",
      description: "Make a GET request to /{dao}/health",
      outputSchema: { data: healthQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_ALL) },
    },
    async ({ dao }) => healthHandler({ dao }),
  );

  server.registerTool(
    "historicalDelegations",
    {
      title: "Get historical delegations",
      description:
        "Get historical delegations for an account, with optional filtering and sorting",
      outputSchema: { data: historicalDelegationsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: historicalDelegationsQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      historicalDelegationsHandler({ dao, address, params }),
  );

  server.registerTool(
    "delegations",
    {
      title: "Get delegations",
      description: "Get current delegations for an account",
      outputSchema: { data: delegationsQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_ALL), address: z.string() },
    },
    async ({ dao, address }) => delegationsHandler({ dao, address }),
  );

  server.registerTool(
    "delegators",
    {
      title: "Get delegators",
      description: "Get current delegators of an account with voting power",
      outputSchema: { data: delegatorsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: delegatorsQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      delegatorsHandler({ dao, address, params }),
  );

  server.registerTool(
    "getLiquidTreasury",
    {
      title: "Get liquid treasury data",
      description:
        "Get historical Liquid Treasury (treasury without DAO tokens) from external providers (DefiLlama/Dune)",
      outputSchema: { data: getLiquidTreasuryQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: getLiquidTreasuryQueryParamsSchema,
      },
    },
    async ({ dao, params }) => getLiquidTreasuryHandler({ dao, params }),
  );

  server.registerTool(
    "getDaoTokenTreasury",
    {
      title: "Get DAO token treasury data",
      description:
        "Get historical DAO Token Treasury value (governance token quantity × token price)",
      outputSchema: { data: getDaoTokenTreasuryQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: getDaoTokenTreasuryQueryParamsSchema,
      },
    },
    async ({ dao, params }) => getDaoTokenTreasuryHandler({ dao, params }),
  );

  server.registerTool(
    "getTotalTreasury",
    {
      title: "Get total treasury data",
      description:
        "Get historical Total Treasury (liquid treasury + DAO token treasury)",
      outputSchema: { data: getTotalTreasuryQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: getTotalTreasuryQueryParamsSchema,
      },
    },
    async ({ dao, params }) => getTotalTreasuryHandler({ dao, params }),
  );

  server.registerTool(
    "historicalTokenData",
    {
      title: "Get historical token data",
      description: "Get historical market data for a specific token",
      outputSchema: { data: historicalTokenDataQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: historicalTokenDataQueryParamsSchema,
      },
    },
    async ({ dao, params }) => historicalTokenDataHandler({ dao, params }),
  );

  server.registerTool(
    "token",
    {
      title: "Get token properties",
      description: "Get property data for a specific token",
      outputSchema: { data: tokenQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_ALL), params: tokenQueryParamsSchema },
    },
    async ({ dao, params }) => tokenHandler({ dao, params }),
  );

  server.registerTool(
    "feedEvents",
    {
      title: "Get feed events",
      description: "Make a GET request to /{dao}/feed/events",
      outputSchema: { data: feedEventsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: feedEventsQueryParamsSchema,
      },
    },
    async ({ dao, params }) => feedEventsHandler({ dao, params }),
  );

  server.registerTool(
    "getEventRelevanceThreshold",
    {
      title: "Get event relevance threshold",
      description: "Make a GET request to /{dao}/event-relevance/threshold",
      outputSchema: { data: getEventRelevanceThresholdQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: getEventRelevanceThresholdQueryParamsSchema,
      },
    },
    async ({ dao, params }) =>
      getEventRelevanceThresholdHandler({ dao, params }),
  );

  server.registerTool(
    "compareTotalSupply",
    {
      title: "Compare total supply between periods",
      description: "Make a GET request to /{dao}/total-supply/compare",
      outputSchema: { data: compareTotalSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareTotalSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareTotalSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareDelegatedSupply",
    {
      title: "Compare delegated supply between periods",
      description: "Make a GET request to /{dao}/delegated-supply/compare",
      outputSchema: { data: compareDelegatedSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareDelegatedSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareDelegatedSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareCirculatingSupply",
    {
      title: "Compare circulating supply between periods",
      description: "Make a GET request to /{dao}/circulating-supply/compare",
      outputSchema: { data: compareCirculatingSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareCirculatingSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareCirculatingSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareTreasury",
    {
      title: "Compare treasury between periods",
      description: "Make a GET request to /{dao}/treasury/compare",
      outputSchema: { data: compareTreasuryQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareTreasuryQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareTreasuryHandler({ dao, params }),
  );

  server.registerTool(
    "compareCexSupply",
    {
      title: "Compare cex supply between periods",
      description: "Make a GET request to /{dao}/cex-supply/compare",
      outputSchema: { data: compareCexSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareCexSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareCexSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareDexSupply",
    {
      title: "Compare dex supply between periods",
      description: "Make a GET request to /{dao}/dex-supply/compare",
      outputSchema: { data: compareDexSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareDexSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareDexSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareLendingSupply",
    {
      title: "Compare lending supply between periods",
      description: "Make a GET request to /{dao}/lending-supply/compare",
      outputSchema: { data: compareLendingSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareLendingSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareLendingSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareActiveSupply",
    {
      title: "Get active token supply for DAO",
      description: "Make a GET request to /{dao}/active-supply/compare",
      outputSchema: { data: compareActiveSupplyQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareActiveSupplyQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareActiveSupplyHandler({ dao, params }),
  );

  server.registerTool(
    "compareProposals",
    {
      title: "Compare number of proposals between time periods",
      description: "Make a GET request to /{dao}/proposals/compare",
      outputSchema: { data: compareProposalsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareProposalsQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareProposalsHandler({ dao, params }),
  );

  server.registerTool(
    "compareVotes",
    {
      title: "Compare number of votes between time periods",
      description: "Make a GET request to /{dao}/votes/compare",
      outputSchema: { data: compareVotesQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareVotesQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareVotesHandler({ dao, params }),
  );

  server.registerTool(
    "compareAverageTurnout",
    {
      title: "Compare average turnout between time periods",
      description: "Make a GET request to /{dao}/average-turnout/compare",
      outputSchema: { data: compareAverageTurnoutQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: compareAverageTurnoutQueryParamsSchema,
      },
    },
    async ({ dao, params }) => compareAverageTurnoutHandler({ dao, params }),
  );

  server.registerTool(
    "proposalsActivity",
    {
      title: "Get proposals activity for delegate",
      description:
        "Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window",
      outputSchema: { data: proposalsActivityQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: proposalsActivityQueryParamsSchema,
      },
    },
    async ({ dao, params }) => proposalsActivityHandler({ dao, params }),
  );

  server.registerTool(
    "proposals",
    {
      title: "Get proposals (lean)",
      description:
        "Returns a list of proposals in a lean shape (no calldatas/values/targets execution payload). Use the REST endpoint /{dao}/proposals if you need the full execution payload.",
      outputSchema: { data: proposalsLeanQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: proposalsLeanQueryParamsSchema,
      },
    },
    async ({ dao, params }) => proposalsLeanHandler({ dao, params }),
  );

  server.registerTool(
    "searchProposals",
    {
      title: "Search proposals (lean)",
      description:
        "Returns proposals whose title or identifier partially matches the query, in a lean shape (no calldatas/values/targets execution payload).",
      outputSchema: { data: searchProposalsLeanQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: searchProposalsLeanQueryParamsSchema,
      },
    },
    async ({ dao, params }) => searchProposalsLeanHandler({ dao, params }),
  );

  server.registerTool(
    "proposal",
    {
      title: "Get a proposal by ID (lean)",
      description:
        "Returns a single proposal by its ID in a lean shape (no calldatas/values/targets execution payload). Use the REST endpoint /{dao}/proposals/{id} if you need the full execution payload.",
      outputSchema: { data: proposalLeanQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_NO_AAVE), id: z.string() },
    },
    async ({ dao, id }) => proposalLeanHandler({ dao, id }),
  );

  server.registerTool(
    "historicalBalances",
    {
      title: "Get historical token balances",
      description:
        "Returns historical balance deltas for one account, enriched with the transfer that caused each change.",
      outputSchema: { data: historicalBalancesQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: historicalBalancesQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      historicalBalancesHandler({ dao, address, params }),
  );

  server.registerTool(
    "transactions",
    {
      title: "Get transactions with transfers and delegations",
      description:
        "Get transactions with their associated transfers and delegations, with optional filtering and sorting",
      outputSchema: { data: transactionsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: transactionsQueryParamsSchema,
      },
    },
    async ({ dao, params }) => transactionsHandler({ dao, params }),
  );

  server.registerTool(
    "lastUpdate",
    {
      title: "Get the last update time",
      description: "Make a GET request to /{dao}/last-update",
      outputSchema: { data: lastUpdateQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: lastUpdateQueryParamsSchema,
      },
    },
    async ({ dao, params }) => lastUpdateHandler({ dao, params }),
  );

  server.registerTool(
    "delegationPercentageByDay",
    {
      title: "Get delegation percentage day buckets with forward-fill",
      description: "Make a GET request to /{dao}/delegation-percentage",
      outputSchema: { data: delegationPercentageByDayQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: delegationPercentageByDayQueryParamsSchema,
      },
    },
    async ({ dao, params }) =>
      delegationPercentageByDayHandler({ dao, params }),
  );

  server.registerTool(
    "historicalVotingPowerByAccountId",
    {
      title: "Get voting power changes by account",
      description:
        "Returns a list of voting power changes for a specific account",
      outputSchema: {
        data: historicalVotingPowerByAccountIdQueryResponseSchema,
      },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: historicalVotingPowerByAccountIdQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      historicalVotingPowerByAccountIdHandler({ dao, address, params }),
  );

  server.registerTool(
    "historicalVotingPower",
    {
      title: "Get voting power changes",
      description: "Returns a list of voting power changes.",
      outputSchema: { data: historicalVotingPowerQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        params: historicalVotingPowerQueryParamsSchema,
      },
    },
    async ({ dao, params }) => historicalVotingPowerHandler({ dao, params }),
  );

  server.registerTool(
    "votingPowerVariations",
    {
      title:
        "Get voting power changes within a time frame for the given addresses",
      description:
        "Returns a mapping of the voting power changes within a time frame for the given addresses",
      outputSchema: { data: votingPowerVariationsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: votingPowerVariationsQueryParamsSchema,
      },
    },
    async ({ dao, params }) => votingPowerVariationsHandler({ dao, params }),
  );

  server.registerTool(
    "votingPowerVariationsByAccountId",
    {
      title:
        "Get top changes in voting power for a given period for a single account",
      description:
        "Returns a the changes to voting power by period and accountId",
      outputSchema: {
        data: votingPowerVariationsByAccountIdQueryResponseSchema,
      },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        address: z.string(),
        params: votingPowerVariationsByAccountIdQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      votingPowerVariationsByAccountIdHandler({ dao, address, params }),
  );

  server.registerTool(
    "votingPowers",
    {
      title: "Get voting powers",
      description: "Returns sorted and paginated account voting power records",
      outputSchema: { data: votingPowersQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        params: votingPowersQueryParamsSchema,
      },
    },
    async ({ dao, params }) => votingPowersHandler({ dao, params }),
  );

  server.registerTool(
    "votingPowerByAccountId",
    {
      title: "Get account powers",
      description:
        "Returns voting power information for a specific address (account)",
      outputSchema: { data: votingPowerByAccountIdQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: votingPowerByAccountIdQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      votingPowerByAccountIdHandler({ dao, address, params }),
  );

  server.registerTool(
    "accountBalanceVariations",
    {
      title: "Get variations in account balances for a given period",
      description:
        "Returns a mapping of the biggest variations to account balances associated by account address",
      outputSchema: { data: accountBalanceVariationsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: accountBalanceVariationsQueryParamsSchema,
      },
    },
    async ({ dao, params }) => accountBalanceVariationsHandler({ dao, params }),
  );

  server.registerTool(
    "accountBalanceVariationsByAccountId",
    {
      title: "Get changes in balance for a given period for a single account",
      description: "Returns a the changes to balance by period and accountId",
      outputSchema: {
        data: accountBalanceVariationsByAccountIdQueryResponseSchema,
      },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        address: z.string(),
        params: accountBalanceVariationsByAccountIdQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      accountBalanceVariationsByAccountIdHandler({ dao, address, params }),
  );

  server.registerTool(
    "accountBalances",
    {
      title: "Get account balance records",
      description: "Returns sorted and paginated account balance records",
      outputSchema: { data: accountBalancesQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        params: accountBalancesQueryParamsSchema,
      },
    },
    async ({ dao, params }) => accountBalancesHandler({ dao, params }),
  );

  server.registerTool(
    "accountBalanceByAccountId",
    {
      title: "Get account balance",
      description: "Returns account balance information for a specific address",
      outputSchema: { data: accountBalanceByAccountIdQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: accountBalanceByAccountIdQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      accountBalanceByAccountIdHandler({ dao, address, params }),
  );

  server.registerTool(
    "accountInteractions",
    {
      title: "Get top interactions between accounts for a given period",
      description:
        "Returns a mapping of the largest interactions between accounts.",
      outputSchema: { data: accountInteractionsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: accountInteractionsQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      accountInteractionsHandler({ dao, address, params }),
  );

  server.registerTool(
    "transfers",
    {
      title: "Get transfers",
      description: "Get transfers of a given address",
      outputSchema: { data: transfersQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_ALL),
        address: z.string(),
        params: transfersQueryParamsSchema,
      },
    },
    async ({ dao, address, params }) =>
      transfersHandler({ dao, address, params }),
  );

  server.registerTool(
    "votesByProposalId",
    {
      title: "List of votes for a given proposal",
      description:
        "Returns a paginated list of votes cast on a specific proposal",
      outputSchema: { data: votesByProposalIdQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        id: z.string(),
        params: votesByProposalIdQueryParamsSchema,
      },
    },
    async ({ dao, id, params }) =>
      votesByProposalIdHandler({ dao, id, params }),
  );

  server.registerTool(
    "votes",
    {
      title: "Get all votes",
      description: "Get all votes ordered by timestamp or voting power",
      outputSchema: { data: votesQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_NO_AAVE), params: votesQueryParamsSchema },
    },
    async ({ dao, params }) => votesHandler({ dao, params }),
  );

  server.registerTool(
    "proposalNonVoters",
    {
      title: "Get a proposal non-voters",
      description:
        "Returns the active delegates that did not vote on a given proposal",
      outputSchema: { data: proposalNonVotersQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        id: z.string(),
        params: proposalNonVotersQueryParamsSchema,
      },
    },
    async ({ dao, id, params }) =>
      proposalNonVotersHandler({ dao, id, params }),
  );

  server.registerTool(
    "dao",
    {
      title: "Get DAO governance parameters",
      description: "Returns current governance parameters for this DAO",
      outputSchema: { data: daoQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_ALL) },
    },
    async ({ dao }) => daoHandler({ dao }),
  );

  server.registerTool(
    "tokenMetrics",
    {
      title: "Get token related metrics",
      description: "Returns token related metrics for a single metric type.",
      outputSchema: { data: tokenMetricsQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_NO_AAVE),
        params: tokenMetricsQueryParamsSchema,
      },
    },
    async ({ dao, params }) => tokenMetricsHandler({ dao, params }),
  );

  server.registerTool(
    "offchainProposals",
    {
      title: "Get offchain proposals (lean)",
      description:
        "Returns a list of offchain (Snapshot) proposals in a lean shape (no markdown body). Use the REST endpoint /{dao}/offchain/proposals if you need the full body.",
      outputSchema: { data: offchainProposalsLeanQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_OFFCHAIN),
        params: offchainProposalsLeanQueryParamsSchema,
      },
    },
    async ({ dao, params }) => offchainProposalsLeanHandler({ dao, params }),
  );

  server.registerTool(
    "offchainSearchProposals",
    {
      title: "Search offchain proposals (lean)",
      description:
        "Returns offchain proposals whose title or identifier partially matches the query, in a lean shape (no markdown body).",
      outputSchema: { data: offchainSearchProposalsLeanQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_OFFCHAIN),
        params: offchainSearchProposalsLeanQueryParamsSchema,
      },
    },
    async ({ dao, params }) =>
      offchainSearchProposalsLeanHandler({ dao, params }),
  );

  server.registerTool(
    "offchainProposalById",
    {
      title: "Get an offchain proposal by ID (lean)",
      description:
        "Returns a single offchain (Snapshot) proposal by its ID in a lean shape (no markdown body). Use the REST endpoint /{dao}/offchain/proposals/{id} if you need the full body.",
      outputSchema: { data: offchainProposalByIdLeanQueryResponseSchema },
      inputSchema: { dao: z.enum(DAO_OFFCHAIN), id: z.string() },
    },
    async ({ dao, id }) => offchainProposalByIdLeanHandler({ dao, id }),
  );

  server.registerTool(
    "votesOffchain",
    {
      title: "Get offchain votes",
      description: "Returns a list of offchain (Snapshot) votes",
      outputSchema: { data: votesOffchainQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_OFFCHAIN),
        params: votesOffchainQueryParamsSchema,
      },
    },
    async ({ dao, params }) => votesOffchainHandler({ dao, params }),
  );

  server.registerTool(
    "votesOffchainByProposalId",
    {
      title: "Get offchain votes for a proposal",
      description:
        "Returns a paginated list of offchain (Snapshot) votes for a specific proposal",
      outputSchema: { data: votesOffchainByProposalIdQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_OFFCHAIN),
        id: z.string(),
        params: votesOffchainByProposalIdQueryParamsSchema,
      },
    },
    async ({ dao, id, params }) =>
      votesOffchainByProposalIdHandler({ dao, id, params }),
  );

  server.registerTool(
    "offchainProposalNonVoters",
    {
      title: "Get offchain proposal non-voters",
      description:
        "Returns the active delegates that did not vote on a given offchain proposal",
      outputSchema: { data: offchainProposalNonVotersQueryResponseSchema },
      inputSchema: {
        dao: z.enum(DAO_OFFCHAIN),
        id: z.string(),
        params: offchainProposalNonVotersQueryParamsSchema,
      },
    },
    async ({ dao, id, params }) =>
      offchainProposalNonVotersHandler({ dao, id, params }),
  );

  server.registerTool(
    "getAddress",
    {
      title: "Get enriched data for an address",
      description:
        "Returns label information from Arkham, ENS data, and whether the address is an EOA or contract.",
      outputSchema: { data: getAddressQueryResponseSchema },
      inputSchema: { address: z.string() },
    },
    async ({ address }) => getAddressHandler({ address }),
  );

  server.registerTool(
    "getAddresses",
    {
      title: "Get enriched data for multiple addresses",
      description:
        "Returns label information from Arkham, ENS data, and address type for multiple addresses. Maximum 100 addresses per request.",
      outputSchema: { data: getAddressesQueryResponseSchema },
      inputSchema: { params: getAddressesQueryParamsSchema },
    },
    async ({ params }) => getAddressesHandler({ params }),
  );

  server.registerTool(
    "relayVote",
    {
      title: "Relay a gasless vote",
      description:
        "Submit an EIP-712 signed vote on behalf of a user. The relayer pays gas.",
      outputSchema: { data: relayVoteMutationResponseSchema },
      inputSchema: {
        dao: z.enum(["ens"] as const),
        data: relayVoteMutationRequestSchema,
      },
    },
    async ({ dao, data }) => relayVoteHandler({ dao, data }),
  );

  server.registerTool(
    "relayDelegate",
    {
      title: "Relay a gasless delegation",
      description:
        "Submit an EIP-712 signed delegation on behalf of a user. The relayer pays gas.",
      outputSchema: { data: relayDelegateMutationResponseSchema },
      inputSchema: {
        dao: z.enum(["ens"] as const),
        data: relayDelegateMutationRequestSchema,
      },
    },
    async ({ dao, data }) => relayDelegateHandler({ dao, data }),
  );

  return server;
}
