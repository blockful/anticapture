import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {};
export var HttpMethod;
(function (HttpMethod) {
    HttpMethod["Connect"] = "CONNECT";
    HttpMethod["Delete"] = "DELETE";
    HttpMethod["Get"] = "GET";
    HttpMethod["Head"] = "HEAD";
    HttpMethod["Options"] = "OPTIONS";
    HttpMethod["Patch"] = "PATCH";
    HttpMethod["Post"] = "POST";
    HttpMethod["Put"] = "PUT";
    HttpMethod["Trace"] = "TRACE";
})(HttpMethod || (HttpMethod = {}));
export var MetricType;
(function (MetricType) {
    MetricType["CexSupply"] = "CEX_SUPPLY";
    MetricType["CirculatingSupply"] = "CIRCULATING_SUPPLY";
    MetricType["DelegatedSupply"] = "DELEGATED_SUPPLY";
    MetricType["DexSupply"] = "DEX_SUPPLY";
    MetricType["LendingSupply"] = "LENDING_SUPPLY";
    MetricType["TotalSupply"] = "TOTAL_SUPPLY";
    MetricType["Treasury"] = "TREASURY";
})(MetricType || (MetricType = {}));
export var QueryInput_CompareActiveSupply_DaoId;
(function (QueryInput_CompareActiveSupply_DaoId) {
    QueryInput_CompareActiveSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareActiveSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareActiveSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareActiveSupply_DaoId || (QueryInput_CompareActiveSupply_DaoId = {}));
export var QueryInput_CompareActiveSupply_Days;
(function (QueryInput_CompareActiveSupply_Days) {
    QueryInput_CompareActiveSupply_Days["7d"] = "_7d";
    QueryInput_CompareActiveSupply_Days["30d"] = "_30d";
    QueryInput_CompareActiveSupply_Days["90d"] = "_90d";
    QueryInput_CompareActiveSupply_Days["180d"] = "_180d";
    QueryInput_CompareActiveSupply_Days["365d"] = "_365d";
})(QueryInput_CompareActiveSupply_Days || (QueryInput_CompareActiveSupply_Days = {}));
export var QueryInput_CompareAverageTurnout_DaoId;
(function (QueryInput_CompareAverageTurnout_DaoId) {
    QueryInput_CompareAverageTurnout_DaoId["Arb"] = "ARB";
    QueryInput_CompareAverageTurnout_DaoId["Ens"] = "ENS";
    QueryInput_CompareAverageTurnout_DaoId["Uni"] = "UNI";
})(QueryInput_CompareAverageTurnout_DaoId || (QueryInput_CompareAverageTurnout_DaoId = {}));
export var QueryInput_CompareAverageTurnout_Days;
(function (QueryInput_CompareAverageTurnout_Days) {
    QueryInput_CompareAverageTurnout_Days["7d"] = "_7d";
    QueryInput_CompareAverageTurnout_Days["30d"] = "_30d";
    QueryInput_CompareAverageTurnout_Days["90d"] = "_90d";
    QueryInput_CompareAverageTurnout_Days["180d"] = "_180d";
    QueryInput_CompareAverageTurnout_Days["365d"] = "_365d";
})(QueryInput_CompareAverageTurnout_Days || (QueryInput_CompareAverageTurnout_Days = {}));
export var QueryInput_CompareCexSupply_DaoId;
(function (QueryInput_CompareCexSupply_DaoId) {
    QueryInput_CompareCexSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareCexSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareCexSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareCexSupply_DaoId || (QueryInput_CompareCexSupply_DaoId = {}));
export var QueryInput_CompareCexSupply_Days;
(function (QueryInput_CompareCexSupply_Days) {
    QueryInput_CompareCexSupply_Days["7d"] = "_7d";
    QueryInput_CompareCexSupply_Days["30d"] = "_30d";
    QueryInput_CompareCexSupply_Days["90d"] = "_90d";
    QueryInput_CompareCexSupply_Days["180d"] = "_180d";
    QueryInput_CompareCexSupply_Days["365d"] = "_365d";
})(QueryInput_CompareCexSupply_Days || (QueryInput_CompareCexSupply_Days = {}));
export var QueryInput_CompareCirculatingSupply_DaoId;
(function (QueryInput_CompareCirculatingSupply_DaoId) {
    QueryInput_CompareCirculatingSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareCirculatingSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareCirculatingSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareCirculatingSupply_DaoId || (QueryInput_CompareCirculatingSupply_DaoId = {}));
export var QueryInput_CompareCirculatingSupply_Days;
(function (QueryInput_CompareCirculatingSupply_Days) {
    QueryInput_CompareCirculatingSupply_Days["7d"] = "_7d";
    QueryInput_CompareCirculatingSupply_Days["30d"] = "_30d";
    QueryInput_CompareCirculatingSupply_Days["90d"] = "_90d";
    QueryInput_CompareCirculatingSupply_Days["180d"] = "_180d";
    QueryInput_CompareCirculatingSupply_Days["365d"] = "_365d";
})(QueryInput_CompareCirculatingSupply_Days || (QueryInput_CompareCirculatingSupply_Days = {}));
export var QueryInput_CompareDelegatedSupply_DaoId;
(function (QueryInput_CompareDelegatedSupply_DaoId) {
    QueryInput_CompareDelegatedSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareDelegatedSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareDelegatedSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareDelegatedSupply_DaoId || (QueryInput_CompareDelegatedSupply_DaoId = {}));
export var QueryInput_CompareDelegatedSupply_Days;
(function (QueryInput_CompareDelegatedSupply_Days) {
    QueryInput_CompareDelegatedSupply_Days["7d"] = "_7d";
    QueryInput_CompareDelegatedSupply_Days["30d"] = "_30d";
    QueryInput_CompareDelegatedSupply_Days["90d"] = "_90d";
    QueryInput_CompareDelegatedSupply_Days["180d"] = "_180d";
    QueryInput_CompareDelegatedSupply_Days["365d"] = "_365d";
})(QueryInput_CompareDelegatedSupply_Days || (QueryInput_CompareDelegatedSupply_Days = {}));
export var QueryInput_CompareDexSupply_DaoId;
(function (QueryInput_CompareDexSupply_DaoId) {
    QueryInput_CompareDexSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareDexSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareDexSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareDexSupply_DaoId || (QueryInput_CompareDexSupply_DaoId = {}));
export var QueryInput_CompareDexSupply_Days;
(function (QueryInput_CompareDexSupply_Days) {
    QueryInput_CompareDexSupply_Days["7d"] = "_7d";
    QueryInput_CompareDexSupply_Days["30d"] = "_30d";
    QueryInput_CompareDexSupply_Days["90d"] = "_90d";
    QueryInput_CompareDexSupply_Days["180d"] = "_180d";
    QueryInput_CompareDexSupply_Days["365d"] = "_365d";
})(QueryInput_CompareDexSupply_Days || (QueryInput_CompareDexSupply_Days = {}));
export var QueryInput_CompareLendingSupply_DaoId;
(function (QueryInput_CompareLendingSupply_DaoId) {
    QueryInput_CompareLendingSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareLendingSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareLendingSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareLendingSupply_DaoId || (QueryInput_CompareLendingSupply_DaoId = {}));
export var QueryInput_CompareLendingSupply_Days;
(function (QueryInput_CompareLendingSupply_Days) {
    QueryInput_CompareLendingSupply_Days["7d"] = "_7d";
    QueryInput_CompareLendingSupply_Days["30d"] = "_30d";
    QueryInput_CompareLendingSupply_Days["90d"] = "_90d";
    QueryInput_CompareLendingSupply_Days["180d"] = "_180d";
    QueryInput_CompareLendingSupply_Days["365d"] = "_365d";
})(QueryInput_CompareLendingSupply_Days || (QueryInput_CompareLendingSupply_Days = {}));
export var QueryInput_CompareProposals_DaoId;
(function (QueryInput_CompareProposals_DaoId) {
    QueryInput_CompareProposals_DaoId["Arb"] = "ARB";
    QueryInput_CompareProposals_DaoId["Ens"] = "ENS";
    QueryInput_CompareProposals_DaoId["Uni"] = "UNI";
})(QueryInput_CompareProposals_DaoId || (QueryInput_CompareProposals_DaoId = {}));
export var QueryInput_CompareProposals_Days;
(function (QueryInput_CompareProposals_Days) {
    QueryInput_CompareProposals_Days["7d"] = "_7d";
    QueryInput_CompareProposals_Days["30d"] = "_30d";
    QueryInput_CompareProposals_Days["90d"] = "_90d";
    QueryInput_CompareProposals_Days["180d"] = "_180d";
    QueryInput_CompareProposals_Days["365d"] = "_365d";
})(QueryInput_CompareProposals_Days || (QueryInput_CompareProposals_Days = {}));
export var QueryInput_CompareTotalSupply_DaoId;
(function (QueryInput_CompareTotalSupply_DaoId) {
    QueryInput_CompareTotalSupply_DaoId["Arb"] = "ARB";
    QueryInput_CompareTotalSupply_DaoId["Ens"] = "ENS";
    QueryInput_CompareTotalSupply_DaoId["Uni"] = "UNI";
})(QueryInput_CompareTotalSupply_DaoId || (QueryInput_CompareTotalSupply_DaoId = {}));
export var QueryInput_CompareTotalSupply_Days;
(function (QueryInput_CompareTotalSupply_Days) {
    QueryInput_CompareTotalSupply_Days["7d"] = "_7d";
    QueryInput_CompareTotalSupply_Days["30d"] = "_30d";
    QueryInput_CompareTotalSupply_Days["90d"] = "_90d";
    QueryInput_CompareTotalSupply_Days["180d"] = "_180d";
    QueryInput_CompareTotalSupply_Days["365d"] = "_365d";
})(QueryInput_CompareTotalSupply_Days || (QueryInput_CompareTotalSupply_Days = {}));
export var QueryInput_CompareTreasury_DaoId;
(function (QueryInput_CompareTreasury_DaoId) {
    QueryInput_CompareTreasury_DaoId["Arb"] = "ARB";
    QueryInput_CompareTreasury_DaoId["Ens"] = "ENS";
    QueryInput_CompareTreasury_DaoId["Uni"] = "UNI";
})(QueryInput_CompareTreasury_DaoId || (QueryInput_CompareTreasury_DaoId = {}));
export var QueryInput_CompareTreasury_Days;
(function (QueryInput_CompareTreasury_Days) {
    QueryInput_CompareTreasury_Days["7d"] = "_7d";
    QueryInput_CompareTreasury_Days["30d"] = "_30d";
    QueryInput_CompareTreasury_Days["90d"] = "_90d";
    QueryInput_CompareTreasury_Days["180d"] = "_180d";
    QueryInput_CompareTreasury_Days["365d"] = "_365d";
})(QueryInput_CompareTreasury_Days || (QueryInput_CompareTreasury_Days = {}));
export var QueryInput_CompareVotes_DaoId;
(function (QueryInput_CompareVotes_DaoId) {
    QueryInput_CompareVotes_DaoId["Arb"] = "ARB";
    QueryInput_CompareVotes_DaoId["Ens"] = "ENS";
    QueryInput_CompareVotes_DaoId["Uni"] = "UNI";
})(QueryInput_CompareVotes_DaoId || (QueryInput_CompareVotes_DaoId = {}));
export var QueryInput_CompareVotes_Days;
(function (QueryInput_CompareVotes_Days) {
    QueryInput_CompareVotes_Days["7d"] = "_7d";
    QueryInput_CompareVotes_Days["30d"] = "_30d";
    QueryInput_CompareVotes_Days["90d"] = "_90d";
    QueryInput_CompareVotes_Days["180d"] = "_180d";
    QueryInput_CompareVotes_Days["365d"] = "_365d";
})(QueryInput_CompareVotes_Days || (QueryInput_CompareVotes_Days = {}));
export var QueryInput_HistoricalTokenData_DaoId;
(function (QueryInput_HistoricalTokenData_DaoId) {
    QueryInput_HistoricalTokenData_DaoId["Arb"] = "ARB";
    QueryInput_HistoricalTokenData_DaoId["Ens"] = "ENS";
    QueryInput_HistoricalTokenData_DaoId["Uni"] = "UNI";
})(QueryInput_HistoricalTokenData_DaoId || (QueryInput_HistoricalTokenData_DaoId = {}));
export var QueryInput_TotalAssets_DaoId;
(function (QueryInput_TotalAssets_DaoId) {
    QueryInput_TotalAssets_DaoId["Arb"] = "ARB";
    QueryInput_TotalAssets_DaoId["Ens"] = "ENS";
    QueryInput_TotalAssets_DaoId["Uni"] = "UNI";
})(QueryInput_TotalAssets_DaoId || (QueryInput_TotalAssets_DaoId = {}));
export var QueryInput_TotalAssets_Days;
(function (QueryInput_TotalAssets_Days) {
    QueryInput_TotalAssets_Days["7d"] = "_7d";
    QueryInput_TotalAssets_Days["30d"] = "_30d";
    QueryInput_TotalAssets_Days["90d"] = "_90d";
    QueryInput_TotalAssets_Days["180d"] = "_180d";
    QueryInput_TotalAssets_Days["365d"] = "_365d";
})(QueryInput_TotalAssets_Days || (QueryInput_TotalAssets_Days = {}));
export const GetDaoDataDocument = gql `
    query GetDaoData($daoId: String!) {
  dao(id: $daoId) {
    id
    quorum
    proposalThreshold
    votingDelay
    votingPeriod
    timelockDelay
  }
}
    `;
/**
 * __useGetDaoDataQuery__
 *
 * To run a query within a React component, call `useGetDaoDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDaoDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDaoDataQuery({
 *   variables: {
 *      daoId: // value for 'daoId'
 *   },
 * });
 */
export function useGetDaoDataQuery(baseOptions) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useQuery(GetDaoDataDocument, options);
}
export function useGetDaoDataLazyQuery(baseOptions) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useLazyQuery(GetDaoDataDocument, options);
}
export function useGetDaoDataSuspenseQuery(baseOptions) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
    return Apollo.useSuspenseQuery(GetDaoDataDocument, options);
}
