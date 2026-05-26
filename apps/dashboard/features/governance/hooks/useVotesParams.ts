import { useCallback } from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

import {
  orderDirectionEnum,
  type OrderDirection,
  type VotesByProposalIdQueryParamsOrderByEnumKey,
  votesByProposalIdQueryParamsOrderByEnum,
} from "@anticapture/client";

type VoteSupportFilter = "0" | "1" | "2";

export type VotesFilters = {
  orderBy: VotesByProposalIdQueryParamsOrderByEnumKey;
  orderDirection: OrderDirection;
  support?: VoteSupportFilter;
  voter?: string;
};

export function useVotesParams() {
  const [orderBy, setOrderBy] = useQueryState(
    "sort",
    parseAsStringEnum<VotesByProposalIdQueryParamsOrderByEnumKey>(
      Object.values(votesByProposalIdQueryParamsOrderByEnum),
    ).withDefault(votesByProposalIdQueryParamsOrderByEnum.votingPower),
  );
  const [orderDirection, setOrderDirection] = useQueryState(
    "dir",
    parseAsStringEnum<OrderDirection>(
      Object.values(orderDirectionEnum),
    ).withDefault(orderDirectionEnum.desc),
  );
  const [support, setSupport] = useQueryState(
    "support",
    parseAsStringEnum<VoteSupportFilter>(["0", "1", "2"]),
  );
  const [voter, setVoter] = useQueryState("voter", parseAsString);

  const filters: VotesFilters = {
    orderBy,
    orderDirection,
    support: support ?? undefined,
    voter: voter ?? undefined,
  };

  const setFilters = useCallback(
    (newFilters: Partial<VotesFilters>) => {
      if (newFilters.orderBy !== undefined) setOrderBy(newFilters.orderBy);
      if (newFilters.orderDirection !== undefined) {
        setOrderDirection(newFilters.orderDirection);
      }
      if ("support" in newFilters) setSupport(newFilters.support ?? null);
      if ("voter" in newFilters) setVoter(newFilters.voter ?? null);
    },
    [setOrderBy, setOrderDirection, setSupport, setVoter],
  );

  return { filters, setFilters };
}
