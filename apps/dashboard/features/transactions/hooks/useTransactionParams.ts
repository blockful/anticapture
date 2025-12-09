"use client";

import { useEffect, useRef } from "react";
import { parseAsInteger, useQueryState } from "nuqs";

interface TransactionsTableParams {
  fromFilter: string;
  setFromFilter: (value: string) => void;
  toFilter: string;
  setToFilter: (value: string) => void;
  minAmount: number | undefined;
  setMinAmount: (value: number | undefined) => void;
  maxAmount: number | undefined;
  setMaxAmount: (value: number | undefined) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

export function useTransactionsTableParams({
  fromFilter,
  setFromFilter,
  toFilter,
  setToFilter,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  sortOrder,
  setSortOrder,
}: TransactionsTableParams) {
  const [from, setFrom] = useQueryState("from");
  const [to, setTo] = useQueryState("to");
  const [min, setMin] = useQueryState("min", parseAsInteger);
  const [max, setMax] = useQueryState("max", parseAsInteger);
  const [sort, setSort] = useQueryState("sort");

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // FROM
    if (from) setFromFilter(from);

    // TO
    if (to) setToFilter(to);

    // MIN AMOUNT
    if (min) setMinAmount(Number(min));

    // MAX AMOUNT
    if (max) setMaxAmount(Number(max));

    // SORT ORDER
    if (sort) setSortOrder(sort as "asc" | "desc");
  }, [
    from,
    to,
    min,
    max,
    sort,
    setFromFilter,
    setToFilter,
    setMinAmount,
    setMaxAmount,
    setSortOrder,
  ]);

  useEffect(() => {
    if (!initialized.current) return;

    // FROM
    if (!fromFilter) setFrom(null);
    else setFrom(fromFilter);

    // TO
    if (!toFilter) setTo(null);
    else setTo(toFilter);

    // MIN
    if (!minAmount) setMin(null);
    else setMin(minAmount);

    // MAX
    if (!maxAmount) setMax(null);
    else setMax(maxAmount);

    // SORT ORDER
    setSort(sortOrder);
  }, [fromFilter, toFilter, minAmount, maxAmount, sortOrder]);
}
