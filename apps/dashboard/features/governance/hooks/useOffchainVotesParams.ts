import { useCallback } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";

import {
  orderDirectionEnum,
  type OrderDirection,
  type VotesOffchainByProposalIdQueryParams,
  type VotesOffchainByProposalIdQueryParamsOrderByEnumKey,
  votesOffchainByProposalIdQueryParamsOrderByEnum,
} from "@anticapture/client";

const DEFAULT_ORDER_BY =
  votesOffchainByProposalIdQueryParamsOrderByEnum.timestamp;
const DEFAULT_ORDER_DIRECTION = orderDirectionEnum.desc;

export function useOffchainVotesParams() {
  const [orderBy, setOrderBy] = useQueryState(
    "sort",
    parseAsStringEnum<VotesOffchainByProposalIdQueryParamsOrderByEnumKey>(
      Object.values(votesOffchainByProposalIdQueryParamsOrderByEnum),
    ).withDefault(DEFAULT_ORDER_BY),
  );
  const [orderDirection, setOrderDirection] = useQueryState(
    "dir",
    parseAsStringEnum<OrderDirection>(
      Object.values(orderDirectionEnum),
    ).withDefault(DEFAULT_ORDER_DIRECTION),
  );

  const filters: VotesOffchainByProposalIdQueryParams = {
    orderBy,
    orderDirection,
  };

  const setFilters = useCallback(
    (newFilters: VotesOffchainByProposalIdQueryParams) => {
      setOrderBy(newFilters.orderBy ?? DEFAULT_ORDER_BY);
      setOrderDirection(newFilters.orderDirection ?? DEFAULT_ORDER_DIRECTION);
    },
    [setOrderBy, setOrderDirection],
  );

  const clearFilters = useCallback(() => {
    setOrderBy(null);
    setOrderDirection(null);
  }, [setOrderBy, setOrderDirection]);

  const activeFiltersCount = [
    orderBy !== DEFAULT_ORDER_BY,
    orderDirection !== DEFAULT_ORDER_DIRECTION,
  ].filter(Boolean).length;

  return { filters, setFilters, clearFilters, activeFiltersCount };
}
