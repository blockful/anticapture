import { BlankSlate, Button } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { Inbox } from "lucide-react";
import { useState, useCallback } from "react";
import {  Hex, isHex, decodeFunctionData, parseAbiItem, decodeAbiParameters } from "viem";
import { EnsGovernorAbi } from "../../abis/ens-governor";

export const ActionsTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="text-primary flex flex-col gap-3 lg:p-4 py-4">
      {proposal.targets.length === 0 ? (
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No actions found"
        />
      ) : (
        proposal.targets.map((target, index) => (
          <ActionItem
            key={index}
            index={index}
            target={proposal.targets[index]}
            value={proposal.values[index]}
            calldata={proposal.calldatas[index]}
          />
        ))
      )}
    </div>
  );
};

interface ActionItemProps {
  target: string | null;
  value: string | null;
  calldata: string | null;
  index: number;
}

interface FourByteSignature {
  id: number;
  text_signature: string;
  hex_signature: string;
}

interface FourByteResponse {
  count: number;
  results: FourByteSignature[];
}

interface DecodedCalldata {
  functionName: string;
  signature: string;
  args: { name: string; type: string; value: string }[];
}

/**
 * Formats a value for display (handles BigInt, arrays, objects, etc.)
 */
const formatArgValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatArgValue).join(", ")}]`;
  }
  if (typeof value === "object") {
    return JSON.stringify(
      value,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );
  }
  return String(value);
};

/**
 * Fetches function signature from 4byte.directory API
 */
const fetchFunctionSignature = async (
  selector: string,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`,
    );

    if (!response.ok) {
      return null;
    }

    const data: FourByteResponse = await response.json();

    if (data.count > 0 && data.results.length > 0) {
      // Return the first (most common) signature
      return data.results[0].text_signature;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Decodes calldata using the function signature from 4byte.directory
 */
const decodeCalldataWithSignature = (
  calldata: Hex,
  signature: string,
): DecodedCalldata | null => {
  try {
    // Parse the signature to extract function name and parameter types
    const match = signature.match(/^(\w+)\((.*)\)$/);
    if (!match) return null;

    const [, functionName, paramsString] = match;

    // Parse the ABI item from the signature
    const abiItem = parseAbiItem(`function ${signature}`);
    if (abiItem.type !== "function") return null;

    // Decode the function data
    const decoded = decodeFunctionData({
      abi: [abiItem],
      data: calldata,
    });

    // Parse parameter types from signature
    const paramTypes = paramsString
      ? paramsString.split(",").map((p) => p.trim())
      : [];

    const args = decoded.args
      ? (decoded.args as unknown[]).map((arg, index) => {
          const type = paramTypes[index] || "unknown";
          return {
            name: `param${index}`,
            type,
            value: formatArgValue(arg),
          };
        })
      : [];

    return {
      functionName,
      signature,
      args,
    };
  } catch {
    return null;
  }
};

/**
 * Formats decoded calldata for display
 */
const formatDecodedCalldata = (decoded: DecodedCalldata): string => {
  const lines: string[] = [];

  lines.push(`Function: ${decoded.functionName}`);
  lines.push(`Signature: ${decoded.signature}`);

  if (decoded.args.length > 0) {
    lines.push("");
    lines.push("Parameters:");

    decoded.args.forEach((arg, index) => {
      lines.push(`  [${index}] ${arg.type} ${arg.name}: ${arg.value}`);
    });
  }

  return lines.join("\n");
};


const ActionItem = ({ target, value, calldata, index }: ActionItemProps) => {
  const [isDecoded, setIsDecoded] = useState(false);
  const [decodedCalldataStr, setDecodedCalldataStr] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const performDecode = useCallback(async () => {
    if (!calldata || !isHex(calldata)) {
      return;
    }

    setIsLoading(true);


    debugger;
    const calldataDecoded = decodeAbiParameters(EnsGovernorAbi, calldata)

    console.log(calldataDecoded);

    setIsLoading(false);

  }, [calldata]);

  const handleToggleDecode = useCallback(() => {
    if (!isDecoded && !decodedCalldataStr) {
      // First time decoding - fetch and decode
      performDecode();
    }
    setIsDecoded(!isDecoded);
  }, [isDecoded, decodedCalldataStr, performDecode]);

  const displayCalldata =
    isDecoded && decodedCalldataStr ? decodedCalldataStr : calldata;

  return (
    <div className="border-border-default flex w-full flex-col gap-2 border">
      <div className="bg-surface-contrast flex w-full items-center justify-between gap-2 p-3">
        <div>
          <p className="text-primary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider">
            // Action {index + 1}
          </p>
        </div>
        <DefaultLink
          href={`https://etherscan.io/address/${target}`}
          openInNewTab
          className="text-secondary font-mono text-xs font-medium uppercase not-italic leading-4 tracking-wider"
        >
          Contract
        </DefaultLink>
      </div>

      <div className="flex w-full flex-col gap-3 p-3">
        <div className="flex w-full gap-2">
          <p className="font-mono min-w-[88px] text-sm font-normal not-italic leading-5">
            target:
          </p>
          <p className="text-secondary font-mono text-sm font-normal not-italic leading-5">
            {target}
          </p>
        </div>

        <div className="flex w-full gap-2">
          <p className="font-mono min-w-[88px] shrink-0 text-sm font-normal not-italic leading-5">
            calldata:
          </p>
          <div className="border-border-contrast relative min-w-0 flex-1 border">
            <div className="scrollbar-thin max-h-[248px] overflow-y-auto p-3">
              <p
                className={`text-secondary font-mono text-sm font-normal not-italic leading-5 ${
                  isDecoded ? "whitespace-pre-wrap" : "break-all"
                }`}
              >
                {displayCalldata}
              </p>
            </div>
            {calldata && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDecode}
                loading={isLoading}
                className="bg-surface-default border-border-contrast absolute -right-px -bottom-px border"
              >
                {isDecoded ? "Encode" : "Decode"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex w-full gap-2">
          <p className="font-mono min-w-[88px] text-sm font-normal not-italic leading-5">
            value:
          </p>
          <p className="text-secondary font-mono text-sm font-normal not-italic leading-5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};
