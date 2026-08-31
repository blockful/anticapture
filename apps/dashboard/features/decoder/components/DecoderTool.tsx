"use client";

import { FileSearch } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { isAddress, type Abi, type Address } from "viem";

import { CopyRawButton } from "@/features/decoder/components/CopyRawButton";
import { DecodedActionCard } from "@/features/decoder/components/DecodedActionCard";
import { DecoderCardSkeleton } from "@/features/decoder/components/DecoderCardSkeleton";
import { DecoderInputPanel } from "@/features/decoder/components/DecoderInputPanel";
import {
  isValidCalldataInput,
  normalizeCalldataInput,
  PERMALINK_CALLDATA_LIMIT,
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

  // Calldata past the permalink limit lives here instead of the URL: request
  // lines have practical size caps, and a permalink that cannot open is worse
  // than no permalink. The UI says so next to the copy affordance.
  const [oversizedCalldata, setOversizedCalldata] = useState<string | null>(
    null,
  );
  const calldataInput = oversizedCalldata ?? calldata;

  const handleCalldataChange = (value: string) => {
    if (value.length > PERMALINK_CALLDATA_LIMIT) {
      setOversizedCalldata(value);
      if (calldata) void setParams({ calldata: "" });
    } else {
      setOversizedCalldata(null);
      void setParams({ calldata: value });
    }
  };

  // The store version is React state so a new upload re-renders and re-keys
  // the decode query.
  const [, setStoreVersion] = useState(0);
  const uploadedAbis = useMemo(
    () => createUploadedAbiStore((version) => setStoreVersion(version)),
    [],
  );
  const [uploadedAbi, setUploadedAbi] = useState<Abi | null>(null);

  const normalized = normalizeCalldataInput(calldataInput);
  const hasInput = normalized.length > 0;
  const inputValid = !hasInput || isValidCalldataInput(normalized);
  const trimmedAddress = address.trim();
  const addressValid = trimmedAddress === "" || isAddress(trimmedAddress);
  const target =
    addressValid && trimmedAddress ? (trimmedAddress as Address) : undefined;

  // The uploaded ABI scopes to the selected target when one exists, so it
  // never preempts resolution for unrelated contracts (a wrapper's child
  // targets, or whatever address the user types next). The global entry is
  // reserved for genuinely targetless decoding, and the store is rebuilt
  // whenever the ABI or the target changes.
  useEffect(() => {
    uploadedAbis.clearAll();
    if (uploadedAbi) uploadedAbis.set(uploadedAbi, target);
  }, [uploadedAbi, target, uploadedAbis]);

  const { data, isLoading } = useDecodedCalldata({
    chainId,
    target,
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

  const handleAbiChange = setUploadedAbi;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-primary font-mono text-sm font-medium uppercase leading-5 tracking-wider">
            {"// "}Calldata decoder
          </h1>
          {oversizedCalldata === null ? (
            <CopyRawButton
              label="copy permalink"
              getTextToCopy={() => window.location.href}
            />
          ) : (
            <span className="text-dimmed font-mono text-xs uppercase leading-4 tracking-wider">
              permalink unavailable: calldata exceeds the URL limit
            </span>
          )}
        </div>
        <p className="text-secondary text-sm">
          Decode any calldata into typed, human-readable parameters. Nested
          Safe, Multicall3 and Timelock batches unpack recursively.
        </p>
      </div>

      <DecoderInputPanel
        calldata={calldataInput}
        address={address}
        chainId={chainId}
        calldataError={
          inputValid
            ? null
            : "Must be 0x-prefixed hex with an even number of characters."
        }
        addressError={addressValid ? null : "Not a valid address."}
        onCalldataChange={handleCalldataChange}
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
          uploadedAbis={uploadedAbis}
        />
      ) : showSkeleton ? (
        <DecoderCardSkeleton />
      ) : null}
    </div>
  );
};
