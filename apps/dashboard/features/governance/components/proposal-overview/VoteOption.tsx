import { formatUnits } from "viem";

import { RadioIndicator } from "@/shared/components/design-system/buttons/RadioIndicator";
import { cn, formatNumberUserReadable } from "@/shared/utils";

interface VoteOptionProps {
  vote: "for" | "against" | "abstain";
  optionPercentage: number;
  votingPower: string;
  onChange: (vote: "for" | "against" | "abstain") => void;
  checked: boolean;
  decimals: number;
}

export const VoteOption = ({
  vote,
  optionPercentage,
  votingPower,
  onChange,
  checked,
  decimals,
}: VoteOptionProps) => {
  const userReadableVotingPower = formatNumberUserReadable(
    Number(formatUnits(BigInt(votingPower), decimals)),
    1,
  );

  return (
    <div className="flex flex-col">
      <label
        className={cn(
          "group flex cursor-pointer items-center justify-between border px-[10px] py-2 transition-colors duration-300 hover:bg-surface-contrast",
          checked ? "border-highlight" : "border-border-default",
        )}
      >
        <div className="flex w-full items-center gap-2">
          <div className="flex w-[100px] items-center gap-2">
            <RadioIndicator
              name="vote"
              checked={checked}
              onChange={() => onChange(vote)}
            />
            <span
              className={cn(
                "font-inter text-[14px] font-normal not-italic leading-[20px]",
                vote === "for"
                  ? "text-success"
                  : vote === "against"
                    ? "text-error"
                    : "text-primary",
              )}
            >
              {vote === "for"
                ? "For"
                : vote === "against"
                  ? "Against"
                  : "Abstain"}
            </span>
          </div>

          <div className="bg-surface-hover relative h-1 w-full max-w-[270px] flex-1">
            <div
              className={cn(
                "h-1 transition-all duration-300 ease-out",
                vote === "for"
                  ? "bg-success"
                  : vote === "against"
                    ? "bg-error"
                    : "bg-primary",
              )}
              style={{ width: `${optionPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <span className="text-primary font-inter w-[50px] text-[14px] font-normal not-italic leading-[20px]">
            {userReadableVotingPower}
          </span>
          <span className="text-primary font-inter w-[50px] text-[14px] font-normal not-italic leading-[20px]">
            {optionPercentage.toFixed(1)}%
          </span>
        </div>
      </label>
    </div>
  );
};
