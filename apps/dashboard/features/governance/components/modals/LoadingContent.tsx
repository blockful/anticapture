import { SpinIcon } from "@/shared/components/icons/SpinIcon";
import { cn } from "@/shared/utils";
import { Check, Hourglass, Pencil } from "lucide-react";

interface LoadingComponentProps {
  transactionhash: string;
  proposalId: string;
  proposalTitle: string;
  votingPower: string;
  vote: "for" | "against" | "abstain";
}

export const LoadingComponent = ({
  transactionhash,
  proposalId,
  proposalTitle,
  votingPower,
  vote,
}: LoadingComponentProps) => {
  console.log(transactionhash);

  return (
    <div className="flex flex-col items-start justify-start gap-3">
      <div className="flex flex-col items-start justify-start gap-3 p-4">
        <div className="flex items-start justify-start">
          <p className="font-inter text-secondary w-[116px] shrink-0 text-[12px] font-medium not-italic leading-[20px]">
            Proposal ID
          </p>
          <p className="font-inter text-primary break-all text-[14px] font-normal not-italic leading-[20px]">
            {proposalId}
          </p>
        </div>
        <div className="flex items-start justify-start">
          <p className="font-inter text-secondary w-[116px] shrink-0 text-[12px] font-medium not-italic leading-[20px]">
            Proposal Title
          </p>
          <p className="font-inter text-primary break-all text-[14px] font-normal not-italic leading-[20px]">
            {proposalTitle}
          </p>
        </div>
        <div className="flex items-start justify-start">
          <p className="font-inter text-secondary w-[116px] shrink-0 text-[12px] font-medium not-italic leading-[20px]">
            Voting Power
          </p>
          <p className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
            {votingPower}
          </p>
        </div>
        <div className="flex items-start justify-start">
          <p className="font-inter text-secondary w-[116px] shrink-0 text-[12px] font-medium not-italic leading-[20px]">
            Vote
          </p>
          <p
            className={cn(
              "font-inter text-primary rounded-full px-[6px] py-0.5 text-[12px] font-medium not-italic leading-[16px]",
              vote === "for"
                ? "text-success bg-surface-opacity-success"
                : vote === "against"
                  ? "text-error bg-surface-opacity-error"
                  : "text-primary bg-surface-default",
            )}
          >
            {vote === "for"
              ? "For"
              : vote === "against"
                ? "Against"
                : "Abstain"}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-start justify-start gap-3 p-4">
        <div className="border-border-default flex w-full flex-col items-center justify-start gap-3 border p-3">
          {/* Confirm your vote in your wallet */}
          <div className="flex w-full items-center justify-start gap-3">
            {!transactionhash ? (
              <div className="bg-surface-default relative flex size-[32px] items-center justify-center rounded-full">
                <SpinIcon className="absolute left-1/2 top-1/2 size-8 shrink-0 -translate-x-1/2 -translate-y-1/2 animate-spin text-orange-500" />
                <div className="bg-primary flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Pencil className="size-[14px] text-black" />
                </div>
              </div>
            ) : (
              <div className="bg-surface-default relative flex size-[32px] items-center justify-center rounded-full">
                <div className="border-border-default absolute left-1/2 top-1/2 size-8 shrink-0 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[1px]" />
                <div className="bg-surface-opacity-success flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="text-success size-[14px]" />
                </div>
              </div>
            )}
            <p className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
              Confirm your vote in your wallet
            </p>
          </div>

          <div className="flex w-full items-center justify-start">
            <div className="bg-border-default ml-4 h-6 w-0.5 shrink-0" />
          </div>

          {/* Wait for vote submission to complete */}
          <div className="flex w-full items-center justify-start gap-3">
            {transactionhash ? (
              <div className="bg-surface-default relative flex size-[32px] items-center justify-center rounded-full">
                <SpinIcon className="absolute left-1/2 top-1/2 size-8 shrink-0 -translate-x-1/2 -translate-y-1/2 animate-spin text-orange-500" />
                <div className="bg-primary flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Hourglass className="size-[14px] text-black" />
                </div>
              </div>
            ) : (
              <div className="bg-surface-default relative flex size-[32px] items-center justify-center rounded-full">
                <div className="border-border-default absolute left-1/2 top-1/2 size-8 shrink-0 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[1px]" />
                <div className="bg-border-default flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Hourglass className="text-secondary size-[14px]" />
                </div>
              </div>
            )}
            <p className="font-inter text-primary text-[14px] font-normal not-italic leading-[20px]">
              Wait for vote submission to complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
