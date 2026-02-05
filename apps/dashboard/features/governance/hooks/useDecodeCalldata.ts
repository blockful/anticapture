"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { slice, isHex, decodeFunctionData, parseAbiItem, Hex } from "viem";

type SignatureResponse = {
  result?: {
    function?: Record<string, Array<{ name: string }>>;
  };
};

/**
 * Hook to decode calldata using the OpenChain signature database
 * @param calldata - The calldata hex string to decode
 * @param enabled - Whether to enable the query (typically tied to a decode toggle)
 * @returns Object containing decoded string, error, and loading state
 */
export const useDecodeCalldata = ({
  calldata,
  enabled,
}: {
  calldata: string | null;
  enabled: boolean;
}) => {
  return useQuery({
    queryKey: ["decode-calldata", calldata],
    enabled: !!calldata && isHex(calldata) && enabled,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      if (!calldata || !isHex(calldata)) {
        throw new Error("Invalid calldata");
      }

      const selector = slice(calldata as Hex, 0, 4);

      const { data } = await axios.get<SignatureResponse>(
        "https://api.openchain.xyz/signature-database/v1/lookup",
        {
          params: { function: selector },
        },
      );

      const signatures = data.result?.function?.[selector];
      if (!signatures || signatures.length === 0) {
        return "Unknown function signature";
      }

      const textSig = signatures[0].name;
      const abiItem = parseAbiItem(`function ${textSig}`);
      const decoded = decodeFunctionData({
        abi: [abiItem],
        data: calldata as Hex,
      });

      const argsStr = decoded.args
        ? decoded.args.map((arg, i) => `  [${i}]: ${String(arg)}`).join("\n")
        : "  (no args)";

      return `${decoded.functionName}(\n${argsStr}\n)`;
    },
  });
};
