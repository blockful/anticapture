import { useCallback } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";

import { orderDirectionEnum, type OrderDirection } from "@anticapture/client";

export type NonVotersFilters = {
  orderDirection: OrderDirection;
};

export function useNonVotersParams() {
  const [orderDirection, setOrderDirection] = useQueryState(
    "orderDirection",
    parseAsStringEnum<OrderDirection>(
      Object.values(orderDirectionEnum),
    ).withDefault(orderDirectionEnum.desc),
  );

  const filters: NonVotersFilters = { orderDirection };

  const setFilters = useCallback(
    (newFilters: Partial<NonVotersFilters>) => {
      if (newFilters.orderDirection !== undefined) {
        setOrderDirection(newFilters.orderDirection);
      }
    },
    [setOrderDirection],
  );

  return { filters, setFilters };
}
