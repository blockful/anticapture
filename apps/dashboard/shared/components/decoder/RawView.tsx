import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";

/** Raw hex plus the best-effort selector when no ABI matched it. */
export const RawView = ({
  raw,
  selector,
  showSelector = false,
}: {
  raw: string;
  selector?: string | null;
  showSelector?: boolean;
}) => (
  <div className="flex w-full flex-col gap-2">
    {showSelector && selector && (
      <p className="text-dimmed font-mono text-xs leading-4">
        selector: <span className="text-secondary">{selector}</span>
      </p>
    )}
    <CodeBlock code={raw} codeClassName="break-all" />
  </div>
);
