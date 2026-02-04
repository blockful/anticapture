import { BlankSlate, Button } from "@/shared/components";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { Inbox } from "lucide-react";
import { useState, useCallback } from "react";
import { slice, isHex, decodeFunctionData, parseAbiItem } from "viem";
export const ActionsTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="text-primary flex flex-col gap-3 py-4 lg:p-4">
      {proposal.targets.length === 0 ? (
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No actions found"
        />
      ) : (
        proposal.targets.map((_, index) => (
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
const ActionItem = ({ target, value, calldata, index }: ActionItemProps) => {
  const [isDecoded, setIsDecoded] = useState(false);
  const [decodedCalldataStr, setDecodedCalldataStr] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const performDecode = useCallback(async () => {
    if (!calldata || !isHex(calldata)) return;
    setIsLoading(true);
    try {
      const selector = slice(calldata, 0, 4);
      const res = await fetch(
        `https://api.openchain.xyz/signature-database/v1/lookup?function=${selector}`,
      );
      const json = await res.json();
      const signatures = json.result?.function?.[selector];
      if (!signatures || signatures.length === 0) {
        setDecodedCalldataStr("Unknown function signature");
        return;
      }
      const textSig = signatures[0].name;
      const abiItem = parseAbiItem(`function ${textSig}`);
      const decoded = decodeFunctionData({
        abi: [abiItem],
        data: calldata,
      });
      const argsStr = decoded.args
        ? decoded.args
            .map((arg, i) => `  [${i}]: ${String(arg)}`)
            .join("\n")
        : "  (no args)";
      setDecodedCalldataStr(`${decoded.functionName}(\n${argsStr}\n)`);
    } catch {
      setDecodedCalldataStr("Failed to decode calldata");
    } finally {
      setIsLoading(false);
    }
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
          <p className="min-w-[88px] font-mono text-sm font-normal not-italic leading-5">
            target:
          </p>
          <p className="text-secondary font-mono text-sm font-normal not-italic leading-5">
            {target}
          </p>
        </div>
        <div className="flex w-full gap-2">
          <p className="min-w-[88px] shrink-0 font-mono text-sm font-normal not-italic leading-5">
            calldata:
          </p>
          <div className="border-border-contrast relative min-w-0 flex-1 border">
            <div className="scrollbar-thin max-h-[248px] overflow-y-auto p-3">
              <p
                className={`text-secondary font-mono text-sm font-normal not-italic leading-5 ${
                  isDecoded  && !isLoading ? "whitespace-pre-wrap" : "break-all"
                } ${isLoading ? "animate-pulse" : ""}`}
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
                className="bg-surface-default border-border-contrast absolute -bottom-px -right-px border"
              >
                {isDecoded ? "Encode" : "Decode"}
              </Button>
            )}
          </div>
        </div>
        <div className="flex w-full gap-2">
          <p className="min-w-[88px] font-mono text-sm font-normal not-italic leading-5">
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