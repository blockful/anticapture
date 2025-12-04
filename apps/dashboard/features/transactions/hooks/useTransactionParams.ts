"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // FROM
    const rawFrom = searchParams.get("from");
    if (rawFrom) setFromFilter(rawFrom);

    // TO
    const rawTo = searchParams.get("to");
    if (rawTo) setToFilter(rawTo);

    // MIN AMOUNT
    const rawMinAmount = searchParams.get("minAmount");
    if (rawMinAmount) setMinAmount(Number(rawMinAmount));

    // MAX AMOUNT
    const rawMaxAmount = searchParams.get("maxAmount");
    if (rawMaxAmount) setMaxAmount(Number(rawMaxAmount));

    // SORT ORDER
    const rawSortOrder = searchParams.get("sortOrder");
    if (rawSortOrder === "asc" || rawSortOrder === "desc") {
      setSortOrder(rawSortOrder);
    }
  }, [
    searchParams,
    setFromFilter,
    setToFilter,
    setMinAmount,
    setMaxAmount,
    setSortOrder,
  ]);

  useEffect(() => {
    if (!initialized.current) return;

    const params = new URLSearchParams(searchParams.toString());

    // FROM
    if (!fromFilter) params.delete("from");
    else params.set("from", fromFilter);

    // TO
    if (!toFilter) params.delete("to");
    else params.set("to", toFilter);

    // MIN
    if (!minAmount) params.delete("minAmount");
    else params.set("minAmount", String(minAmount));

    // MAX
    if (!maxAmount) params.delete("maxAmount");
    else params.set("maxAmount", String(maxAmount));

    // SORT ORDER
    params.set("sortOrder", sortOrder);

    const newUrl = `?${params.toString()}`;
    const oldUrl = `?${searchParams.toString()}`;

    if (newUrl !== oldUrl) {
      router.replace(newUrl);
    }
  }, [
    fromFilter,
    toFilter,
    minAmount,
    maxAmount,
    sortOrder,
    router,
    searchParams,
  ]);
}
