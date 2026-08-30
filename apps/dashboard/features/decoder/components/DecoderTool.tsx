"use client";

import { FileSearch } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { isAddress, type Abi, type Address } from "viem";

import { DecodedActionCard } from "@/features/decoder/components/DecodedActionCard";
import { DecoderCardSkeleton } from "@/features/decoder/components/DecoderCardSkeleton";
import { DecoderInputPanel } from "@/features/decoder/components/DecoderInputPanel";
import {
  isValidCalldataInput,
  normalizeCalldataInput,
} from "@/features/decoder/utils/calldataInput";
import { decoderParsers } from "@/features/decoder/utils/decoderSearchParams";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import daoConfigByDaoId from "@/shared/dao-config";
import { useDecodedCalldata } from "@/shared/hooks/useDecodedCalldata";
import { useDelayedFlag } from "@/shared/hooks/useDelayedFlag";
import { useTokenMeta } from "@/shared/hooks/useTokenMeta";
import {
  applyTokenMeta,
  collectTokenHints,
  createUploadedAbiStore,
} from "@/shared/services/decoder";

const explorerForChain = (chainId: number): string | undefined => {
  for (const config of Object.values(daoConfigByDaoId)) {
    const chain = config?.daoOverview?.chain;
    if (chain?.id === chainId) return chain.blockExplorers?.default?.url;
  }
  return undefined;
};

/**
 * The standalone /tools/decoder surface: technical-first paste box with URL
 * permalinks (calldata, address, chain; a custom ABI stays local by design).
 */
export const DecoderTool = () => {
  const [{ calldata, address, chainId }, setParams] =
    useQueryStates(decoderParsers);

  // The store version is React state so a new upload re-renders and re-keys
  // the decode query.
  const [, setStoreVersion] = useState(0);
  const uploadedAbis = useMemo(
    () => createUploadedAbiStore((version) => setStoreVersion(version)),
    [],
  );

  const normalized = normalizeCalldataInput(calldata);
  const hasInput = normalized.length > 0;
  const inputValid = !hasInput || isValidCalldataInput(normalized);
  const trimmedAddress = address.trim();
  const addressValid = trimmedAddress === "" || isAddress(trimmedAddress);

  const { data, isLoading } = useDecodedCalldata({
    chainId,
    target:
      addressValid && trimmedAddress ? (trimmedAddress as Address) : undefined,
    calldata: hasInput && inputValid ? normalized : null,
    uploadedAbis,
  });
  const showSkeleton = useDelayedFlag(isLoading && hasInput && inputValid);

  const tokenHints = useMemo(
    () => (data ? collectTokenHints(data) : []),
    [data],
  );
  const { meta } = useTokenMeta(chainId, tokenHints);
  const call = useMemo(
    () => (data && meta.size > 0 ? applyTokenMeta(data, meta) : data),
    [data, meta],
  );

  const explorerUrl = explorerForChain(chainId);

  const handleAbiChange = (abi: Abi | null) => {
    if (abi) uploadedAbis.set(abi);
    else uploadedAbis.clear();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-primary font-mono text-sm font-medium uppercase leading-5 tracking-wider">
          {"// "}Calldata decoder
        </h1>
        <p className="text-secondary text-sm">
          Decode any calldata into typed, human-readable parameters. Nested
          Safe, Multicall3 and Timelock batches unpack recursively.
        </p>
      </div>

      <DecoderInputPanel
        calldata={calldata}
        address={address}
        chainId={chainId}
        calldataError={
          inputValid
            ? null
            : "Must be 0x-prefixed hex with an even number of characters."
        }
        addressError={addressValid ? null : "Not a valid address."}
        onCalldataChange={(value) => void setParams({ calldata: value })}
        onAddressChange={(value) => void setParams({ address: value })}
        onChainIdChange={(value) => void setParams({ chainId: value })}
        onAbiChange={handleAbiChange}
      />

      {!hasInput ? (
        <BlankSlate
          variant="default"
          icon={FileSearch}
          title="Nothing to decode yet"
          description="Paste calldata above. You can grab it from any transaction: on Etherscan, open the transaction, expand More Details and copy the Input Data."
        />
      ) : !inputValid ? null : call ? (
        <DecodedActionCard
          call={call}
          chainId={chainId}
          explorerUrl={explorerUrl}
        />
      ) : showSkeleton ? (
        <DecoderCardSkeleton />
      ) : null}
    </div>
  );
};
