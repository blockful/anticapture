import { cn, formatNumberUserReadable } from "@/shared/utils";
import { formatEther } from "viem";

interface VoteOptionProps {
  vote: "for" | "against" | "abstain";
  optionPercentage: number;
  votingPower: string;
  onChange: (vote: "for" | "against" | "abstain") => void;
  checked: boolean;
}

export const VoteOption = ({
  vote,
  optionPercentage,
  votingPower,
  onChange,
  checked,
}: VoteOptionProps) => {
  const userReadableVotingPower = formatNumberUserReadable(
    Number(formatEther(BigInt(votingPower))),
    1,
  );

  return (
    <div className="flex flex-col">
      <div className="border-border-default flex items-center justify-between border px-[10px] py-2">
        <div className="flex w-full items-center gap-2">
          <div className="flex w-[100px] items-center gap-2">
            <input
              className="border-primary checked:border-primary checked:bg-primary box-border h-4 w-4 cursor-pointer appearance-none rounded-full border-2 bg-transparent"
              type="radio"
              name="vote"
              id="for"
              checked={checked}
              onChange={() => onChange(vote)}
            />
            <p
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
            </p>
          </div>

          <div className="bg-surface-hover relative h-1 w-full max-w-[270px] flex-1">
            <div
              className={cn(
                "h-1",
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
          {/* <p className="text-primary font-inter w-[50px] text-[14px] font-normal not-italic leading-[20px]">
              {checked && percentageChange.toFixed(1)}
            </p> */}
          <p className="text-primary font-inter w-[50px] text-[14px] font-normal not-italic leading-[20px]">
            {userReadableVotingPower}
          </p>
          <p className="text-primary font-inter w-[50px] text-[14px] font-normal not-italic leading-[20px]">
            {optionPercentage.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};
