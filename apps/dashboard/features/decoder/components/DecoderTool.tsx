"use client";

import { FileSearch } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { isAddress, type Abi } from "viem";

import { CopyRawButton } from "@/shared/components/decoder/CopyRawButton";
import { DecodedActionCard } from "@/shared/components/decoder/DecodedActionCard";
import { DecoderCardSkeleton } from "@/shared/components/decoder/DecoderCardSkeleton";
import { DecoderInputPanel } from "@/features/decoder/components/DecoderInputPanel";
import { permalinkAddress } from "@/features/decoder/utils/addressInput";
import {
  clampCalldataInput,
  exceedsPermalinkLimit,
  isValidCalldataInput,
  normalizeCalldataInput,
} from "@/features/decoder/utils/calldataInput";
import { toSupportedChainId } from "@/features/decoder/utils/chains";
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
  const [{ calldata, address, chainId: chainIdParam }, setParams] =
    useQueryStates(decoderParsers);
  // The URL is user input and this id reaches the ABI proxy as a query
  // parameter: a chain the platform does not index reads as mainnet.
  const chainId = toSupportedChainId(chainIdParam);

  // Calldata past the permalink limit lives here instead of the URL: request
  // lines have practical size caps, and a permalink that cannot open is worse
  // than no permalink. The UI says so next to the copy affordance.
  const [oversizedDraft, setOversizedDraft] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  // Storing an oversized draft always clears the URL param, so the draft is
  // only authoritative while that param is still empty: calldata arriving via
  // the URL afterwards (Back/Forward, a pasted permalink) supersedes it.
  const oversizedCalldata = calldata === "" ? oversizedDraft : null;
  const calldataInput = oversizedCalldata ?? calldata;

  // Only a complete address is a target someone else can open the link on, so
  // the URL carries nothing else and a half-typed one lives here. The draft is
  // authoritative only while the URL still agrees with it: an address arriving
  // via the URL (Back/Forward, a pasted permalink) supersedes it.
  const [addressDraft, setAddressDraft] = useState<string | null>(null);
  const addressInput =
    addressDraft !== null && permalinkAddress(addressDraft) === address
      ? addressDraft
      : address;

  const handleAddressChange = (value: string) => {
    setAddressDraft(value);
    const permalink = permalinkAddress(value);
    if (permalink !== address) void setParams({ address: permalink });
  };

  const handleCalldataChange = (raw: string) => {
    // Nothing past the decode limit is ever looked at, so nothing past it is
    // kept: a multi-megabyte paste would otherwise re-render, re-hash and
    // re-encode on every keystroke that followed it. The reader is told,
    // because the field then holds less than what they pasted into it.
    const value = clampCalldataInput(raw);
    setTruncated(value !== raw);
    if (exceedsPermalinkLimit(value)) {
      setOversizedDraft(value);
      if (calldata) void setParams({ calldata: "" });
    } else {
      setOversizedDraft(null);
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
  const trimmedAddress = addressInput.trim();
  // viem's isAddress is itself a type predicate, so the target narrows here
  // rather than being asserted into an Address further down.
  const target = isAddress(trimmedAddress) ? trimmedAddress : undefined;
  const addressValid = trimmedAddress === "" || target !== undefined;

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
    <div className="flex w-full flex-col gap-4 p-4 lg:p-6">
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
              link omitted: input too long for a URL
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
        address={addressInput}
        chainId={chainId}
        calldataError={
          inputValid
            ? null
            : "Must be 0x-prefixed hex with an even number of characters."
        }
        calldataNotice={
          truncated
            ? "Input truncated to the 128 KiB decode limit."
            : oversizedCalldata !== null
              ? "Link omitted: input too long for a URL."
              : null
        }
        addressError={addressValid ? null : "Not a valid address."}
        onCalldataChange={handleCalldataChange}
        onAddressChange={handleAddressChange}
        onChainIdChange={(value) =>
          void setParams({ chainId: toSupportedChainId(value) })
        }
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
