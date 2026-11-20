/**
 * The reason a voter attached to a vote, shown under the vote's row. Long
 * texts wrap instead of stretching the table; links and line breaks are kept
 * as typed.
 */
export const VoteReason = ({ reason }: { reason: string }) => (
  <div className="flex min-h-10 items-start gap-2 p-2 pl-5">
    <div
      aria-hidden
      className="border-secondary h-6 w-4 shrink-0 -translate-y-3 border-b border-l"
    />
    <p className="text-secondary min-w-0 whitespace-pre-wrap break-words text-sm">
      <span className="text-primary font-medium">Reason: </span>
      {reason}
    </p>
  </div>
);
