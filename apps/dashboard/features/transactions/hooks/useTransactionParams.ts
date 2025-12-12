"use client";

import { parseAsInteger, parseAsStringEnum, useQueryState } from "nuqs";
import { parseAsAddress } from "@/shared/utils/parseAsAddress";
import { Address } from "viem";

export interface TransactionsParamsType {
  min: number | null;
  max: number | null;
  setMin: (min: number) => void;
  setMax: (max: number) => void;
  from: Address | null;
  setFrom: (from: Address) => void;
  to: Address | null;
  setTo: (to: Address) => void;
  sort: "asc" | "desc" | null;
  setSort: (order: "asc" | "desc") => void;
}

export function useTransactionsTableParams(): TransactionsParamsType {
  const [from, setFrom] = useQueryState("from", parseAsAddress);
  const [to, setTo] = useQueryState("to", parseAsAddress);
  const [min, setMin] = useQueryState("min", parseAsInteger);
  const [max, setMax] = useQueryState("max", parseAsInteger);
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringEnum(["asc", "desc"]),
  );

  return { from, to, min, max, sort, setFrom, setTo, setMin, setMax, setSort };
}
