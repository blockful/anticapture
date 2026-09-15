"use client";

import { Braces, FileSearch } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { isAddress, type Abi } from "viem";

import {
  DecoderInputPanel,
  type AbiSourceMode,
} from "@/features/decoder/components/DecoderInputPanel";
import { permalinkAddress } from "@/features/decoder/utils/addressInput";
import {
  clampCalldataInput,
  exceedsPermalinkLimit,
  isValidCalldataInput,
  normalizeCalldataInput,
} from "@/features/decoder/utils/calldataInput";
import { toSupportedChainId } from "@/features/decoder/utils/chains";
import { decoderParsers } from "@/features/decoder/utils/decoderSearchParams";
import { CopyButton } from "@/shared/components/decoder/CopyButton";
import { DecodedActionCard } from "@/shared/components/decoder/DecodedActionCard";
import { DecoderCardSkeleton } from "@/shared/components/decoder/DecoderCardSkeleton";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";
import daoConfigByDaoId from "@/shared/dao-config";
import { useDecodedCalldata } from "@/shared/hooks/useDecodedCalldata";
import { useDelayedFlag } from "@/shared/hooks/useDelayedFlag";
import { useTokenMeta } from "@/shared/hooks/useTokenMeta";
import {
  applyTokenMeta,
  collectTokenHints,
  createUploadedAbiStore,
} from "@/shared/services/decoder";

export const DECODER_DESCRIPTION =
  "See what a transaction really does, including calls hidden inside Safe and Multicall3 batches.";

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

  // Automatic means the decoder is on its own: the address is dropped from
  // the URL on the way there (kept as the draft, whether it was typed or
  // arrived in a permalink, for when the reader comes back) so the link says
  // what the decode used and nothing else. The other two tabs both take an
  // address: the contract tab to fetch its verified ABI, the custom tab to
  // scope the pasted ABI to it.
  const [mode, setMode] = useState<AbiSourceMode>(() =>
    address ? "contract" : "automatic",
  );
  const handleModeChange = (next: AbiSourceMode) => {
    if (next === mode) return;
    setMode(next);
    if (next === "automatic") {
      if (addressDraft === null) setAddressDraft(address);
      void setParams({ address: "" });
    } else if (mode === "automatic" && addressDraft) {
      void setParams({ address: permalinkAddress(addressDraft) });
    }
  };

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
  const typedTarget = isAddress(trimmedAddress) ? trimmedAddress : undefined;
  const addressValid = trimmedAddress === "" || typedTarget !== undefined;
  const target = mode === "automatic" ? undefined : typedTarget;
  const activeAbi = mode === "custom" ? uploadedAbi : null;

  // The uploaded ABI scopes to the selected target when one exists, so it
  // never preempts resolution for unrelated contracts (a wrapper's child
  // targets, or whatever address the user types next). The global entry is
  // reserved for genuinely targetless decoding, and the store is rebuilt
  // whenever the ABI or the target changes.
  useEffect(() => {
    uploadedAbis.clearAll();
    if (activeAbi) uploadedAbis.set(activeAbi, target);
  }, [activeAbi, target, uploadedAbis]);

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

  // The permalink only means something once something decoded, so it lives
  // in the result card's header rather than on the page.
  const permalinkAction =
    oversizedCalldata === null ? (
      <CopyButton
        label="Copy link"
        getTextToCopy={() => window.location.href}
      />
    ) : (
      <span className="text-secondary text-xs leading-4">
        Link unavailable: input too long for a URL
      </span>
    );

  return (
    <div className="flex w-full flex-col gap-6 p-4 lg:p-5">
      <SectionTitle
        icon={<Braces className="text-secondary size-5" aria-hidden="true" />}
        title="Calldata Decoder"
        description={DECODER_DESCRIPTION}
      />

      <div className="flex w-full flex-col gap-2">
        <DecoderInputPanel
          calldata={calldataInput}
          address={addressInput}
          chainId={chainId}
          mode={mode}
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
          onAbiChange={setUploadedAbi}
          onModeChange={handleModeChange}
        />

        {!hasInput ? (
          <BlankSlate
            variant="title"
            icon={FileSearch}
            title="Nothing to decode yet"
            description="Paste the input data of any transaction. On Etherscan it sits under More Details, labelled Input Data."
          />
        ) : !inputValid ? null : call ? (
          <DecodedActionCard
            call={call}
            chainId={chainId}
            explorerUrl={explorerUrl}
            uploadedAbis={uploadedAbis}
            headerRight={permalinkAction}
            showRawToggle={false}
          />
        ) : showSkeleton ? (
          <DecoderCardSkeleton />
        ) : null}
      </div>
    </div>
  );
};
