"use client";

import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  isAddress,
  toFunctionSignature,
  type Abi,
  type AbiFunction,
} from "viem";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { RadioCard } from "@/shared/components/design-system/form/fields/radio-card/RadioCard";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { ProgressBar } from "@/shared/components/design-system/progress-bar/ProgressBar";
import { Spinner } from "@/shared/components/design-system/spinner/Spinner";
import daoConfig from "@/shared/dao-config";
import {
  fetchAddressFromEnsName,
  isEnsAddress,
} from "@/shared/hooks/useEnsData";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { CustomAction } from "@/features/create-proposal/types";
import {
  fetchAbi,
  parseAbiStrict,
} from "@/features/create-proposal/utils/fetchAbi";
import ensGovernorAbi from "@/abis/ens-governor.json";

type Step = 1 | 2;
type ConfigMode = "fetch" | "calldata";

interface AddCustomActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daoId: string;
  onSubmit: (action: CustomAction) => void;
  initialValue?: CustomAction;
}

const bundledAbisByAddress = (daoId: string): Record<string, Abi> => {
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const governor = daoConfig[daoIdEnum]?.daoOverview?.contracts?.governor;
  if (!governor) return {};
  // Validate the bundled JSON once at the boundary rather than casting it
  // straight through. If the import is ever corrupted this returns null and
  // we fall through to the remote fetch path below.
  const validated = parseAbiStrict(ensGovernorAbi);
  if (!validated) return {};
  return { [governor.toLowerCase()]: validated };
};

const lookupAbi = (daoId: string, address: string): Promise<Abi | null> => {
  const bundled = bundledAbisByAddress(daoId)[address.toLowerCase()];
  if (bundled) return Promise.resolve(bundled);
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const chainId = daoConfig[daoIdEnum]?.daoOverview?.chain?.id;
  if (!chainId) return Promise.resolve(null);
  return fetchAbi(chainId, address);
};

const parseAbiJson = (text: string): Abi | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    // Accept either a bare ABI array or a Hardhat/Foundry-style artifact
    // object with an `abi` field. Validate the array with zod so malformed
    // items are rejected at the boundary instead of blowing up later inside
    // viem encoders.
    if (Array.isArray(parsed)) {
      return parseAbiStrict(parsed);
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { abi?: unknown }).abi)
    ) {
      return parseAbiStrict((parsed as { abi: unknown[] }).abi);
    }
    return null;
  } catch {
    return null;
  }
};

export const AddCustomActionModal = ({
  open,
  onOpenChange,
  daoId,
  onSubmit,
  initialValue,
}: AddCustomActionModalProps) => {
  const isEdit = Boolean(initialValue);
  const initialMode: ConfigMode = initialValue?.calldata ? "calldata" : "fetch";

  const [step, setStep] = useState<Step>(1);
  const [contractAddress, setContractAddress] = useState(
    initialValue?.contractAddress ?? "",
  );
  const [mode, setMode] = useState<ConfigMode>(initialMode);

  // Fetch-ABI flow
  const [abiText, setAbiText] = useState(
    initialValue && initialValue.abi.length > 0
      ? JSON.stringify(initialValue.abi, null, 2)
      : "",
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetchingAbi, setIsFetchingAbi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calldata flow
  const [calldata, setCalldata] = useState(initialValue?.calldata ?? "");

  // Step 2
  const [functionName, setFunctionName] = useState(
    initialValue?.functionName ?? "",
  );
  const [args, setArgs] = useState<string[]>(initialValue?.args ?? []);

  // Re-hydrate whenever the modal opens
  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (initialValue) {
      setMode(initialValue.calldata ? "calldata" : "fetch");
      setContractAddress(initialValue.contractAddress);
      setAbiText(
        initialValue.abi.length > 0
          ? JSON.stringify(initialValue.abi, null, 2)
          : "",
      );
      setCalldata(initialValue.calldata ?? "");
      setFunctionName(initialValue.functionName);
      setArgs(initialValue.args);
      setFetchError(null);
      setIsFetchingAbi(false);
    } else {
      setMode("fetch");
      setContractAddress("");
      setAbiText("");
      setCalldata("");
      setFunctionName("");
      setArgs([]);
      setFetchError(null);
      setIsFetchingAbi(false);
    }
  }, [open, initialValue]);

  const abi = useMemo<Abi | null>(() => {
    if (!abiText.trim()) return null;
    return parseAbiJson(abiText);
  }, [abiText]);

  const isAddressValid =
    contractAddress.trim() === "" ||
    isAddress(contractAddress.trim()) ||
    isEnsAddress(contractAddress.trim());

  const functions: AbiFunction[] =
    abi?.filter((item): item is AbiFunction => item.type === "function") ?? [];
  const selectedFn = functions.find(
    (f) => toFunctionSignature(f) === functionName,
  );
  const hasOverloads = (fn: AbiFunction) =>
    functions.filter((f) => f.name === fn.name).length > 1;

  const resetAll = () => {
    setStep(1);
    setMode("fetch");
    setContractAddress("");
    setAbiText("");
    setFetchError(null);
    setIsFetchingAbi(false);
    setCalldata("");
    setFunctionName("");
    setArgs([]);
  };

  const hasAddress = contractAddress.trim().length > 0;

  const handleAddressBlur = async () => {
    if (mode !== "fetch") return;
    const v = contractAddress.trim();
    if (!v) return;
    const isHex = isAddress(v);
    const isEns = isEnsAddress(v);
    if (!isHex && !isEns) return;
    setIsFetchingAbi(true);
    setFetchError(null);
    setAbiText("");
    try {
      const resolved = isHex
        ? v
        : await fetchAddressFromEnsName({ ensName: v as `${string}.eth` });
      if (!resolved) {
        setFetchError(
          "Couldn't resolve the address. Check the value and try again.",
        );
        return;
      }
      const found = await lookupAbi(daoId, resolved);
      if (found) {
        setAbiText(JSON.stringify(found, null, 2));
      } else {
        setFetchError(
          "Couldn't fetch the contract interface automatically. Paste it below or upload a JSON file.",
        );
      }
    } catch {
      setFetchError(
        "Couldn't fetch the contract interface automatically. Paste it below or upload a JSON file.",
      );
    } finally {
      setIsFetchingAbi(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseAbiJson(text);
      if (!parsed) {
        setFetchError("Invalid ABI JSON.");
        return;
      }
      setAbiText(JSON.stringify(parsed, null, 2));
      setFetchError(null);
    } catch {
      setFetchError("Could not read file.");
    }
  };

  const step1Ready =
    contractAddress.trim().length > 0 &&
    isAddressValid &&
    (mode === "fetch" ? Boolean(abi) : calldata.trim().length > 0);

  const step2Ready =
    mode === "fetch" ? Boolean(functionName) : calldata.trim().length > 0;

  const handleConfirm = () => {
    if (mode === "fetch") {
      if (!abi || !functionName) return;
      onSubmit({
        type: "custom",
        contractAddress,
        abi,
        functionName,
        args,
      });
    } else {
      onSubmit({
        type: "custom",
        contractAddress,
        abi: [],
        functionName: "",
        args: [],
        calldata,
      });
    }
    resetAll();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetAll();
    onOpenChange(false);
  };

  const showEmptyAbiState = !hasAddress && !abiText && !isFetchingAbi;
  // Only show the dropzone fallback when an automatic fetch failed.
  const showDropzone = mode === "fetch" && fetchError !== null;

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll();
        onOpenChange(o);
      }}
      title={isEdit ? "Edit Custom Action" : "Add Custom Action"}
      footerLeading={
        <div className="flex items-center gap-3">
          <ProgressBar
            value={step === 1 ? 50 : 100}
            label={`${step}/2`}
            labelPosition="left"
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            {step === 1 ? (
              <Button variant="outline" size="md" onClick={handleClose}>
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                variant="primary"
                size="md"
                disabled={!step1Ready}
                onClick={() => setStep(2)}
                className="gap-1"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={!step2Ready}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FormLabel isRequired>Contract address</FormLabel>
              <Input
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                onBlur={() => void handleAddressBlur()}
                placeholder="Address or ENS"
                error={!isAddressValid}
              />
              <span className="text-secondary text-xs">
                ENS names are supported
              </span>
              {!isAddressValid && (
                <span className="text-error text-xs">
                  Must be a valid address or ENS name
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FormLabel isRequired>
                How would you like to configure this action?
              </FormLabel>
              <div className="flex gap-2">
                <RadioCard
                  label="Fetch ABI"
                  isActive={mode === "fetch"}
                  onClick={() => setMode("fetch")}
                />
                <RadioCard
                  label="Paste Calldata"
                  isActive={mode === "calldata"}
                  onClick={() => setMode("calldata")}
                />
              </div>
            </div>

            {mode === "fetch" ? (
              <div className="flex flex-col gap-3">
                {fetchError && (
                  <InlineAlert variant="warning" text={fetchError} />
                )}

                <div className="flex flex-col gap-1.5">
                  <FormLabel isRequired>Contract Interface</FormLabel>
                  {isFetchingAbi ? (
                    <div className="border-border-contrast bg-surface-default rounded-base flex min-h-32 items-center justify-center gap-2 border">
                      <Spinner size="md" className="text-highlight" />
                      <span className="text-highlight text-sm font-medium">
                        Fetching ABI…
                      </span>
                    </div>
                  ) : (
                    <Textarea
                      value={abiText}
                      onChange={(e) => {
                        setAbiText(e.target.value);
                        setFetchError(null);
                      }}
                      placeholder={
                        showEmptyAbiState
                          ? ""
                          : 'Paste ABI JSON here — e.g. [{"type":"function",...}]'
                      }
                      className="min-h-32 font-mono text-xs"
                      disabled={fetchError === null}
                    />
                  )}
                  {showEmptyAbiState && (
                    <span className="text-secondary text-xs">
                      We&apos;ll fetch the contract interface automatically once
                      you enter the address.
                    </span>
                  )}
                  {abi && !isFetchingAbi && !fetchError && (
                    <span className="text-success text-xs">
                      ABI loaded — {functions.length} function
                      {functions.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {showDropzone && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="bg-border-default h-px flex-1" />
                      <span className="text-secondary text-xs uppercase">
                        Or
                      </span>
                      <div className="bg-border-default h-px flex-1" />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-highlight bg-surface-opacity-brand hover:bg-surface-opacity-brand/80 flex-col gap-2 border-dashed px-3 py-6"
                    >
                      <Upload className="text-highlight size-5" />
                      <span className="text-secondary">
                        Drop ABI file here, or click to browse .json
                      </span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFileUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <FormLabel isRequired>Calldata</FormLabel>
                <Textarea
                  value={calldata}
                  onChange={(e) => setCalldata(e.target.value)}
                  placeholder="0x…"
                  className="min-h-32 font-mono text-xs"
                />
                <span className="text-secondary text-xs">
                  Paste the raw hex-encoded calldata that will be sent to the
                  contract.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {mode === "fetch" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <FormLabel isRequired>Function</FormLabel>
                  <Select
                    items={functions.map((fn) => {
                      const signature = toFunctionSignature(fn);
                      return {
                        label: hasOverloads(fn) ? signature : fn.name,
                        value: signature,
                      };
                    })}
                    value={functionName}
                    placeholder="Select a function…"
                    onValueChange={(signature) => {
                      setFunctionName(signature);
                      const fn = functions.find(
                        (f) => toFunctionSignature(f) === signature,
                      );
                      setArgs(
                        new Array(fn?.inputs.length ?? 0).fill("") as string[],
                      );
                    }}
                  />
                </div>
                {selectedFn?.inputs.map((input, i) => (
                  <div
                    key={`${input.name ?? "arg"}-${i}`}
                    className="flex flex-col gap-1.5"
                  >
                    <FormLabel isRequired>
                      {input.name || `arg${i}`}{" "}
                      <span className="text-secondary font-normal">
                        ({input.type})
                      </span>
                    </FormLabel>
                    <Input
                      value={args[i] ?? ""}
                      onChange={(e) => {
                        const next = [...args];
                        next[i] = e.target.value;
                        setArgs(next);
                      }}
                    />
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <InlineAlert
                  variant="info"
                  text="Review the calldata before confirming. It will be sent as-is to the contract."
                />
                <div className="border-border-default bg-surface-contrast rounded-base break-all border p-3 font-mono text-xs">
                  {calldata}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
