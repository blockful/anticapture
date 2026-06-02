import React, { useState } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import useBaseUrl from "@docusaurus/useBaseUrl";

// API pages render via `@theme/ApiItem/Layout` and guide pages via
// `@theme/DocItem/Layout`, so no single layout swizzle covers both. Injecting
// the button here in `Root` (which wraps the whole app) puts it on every page.
//
// It copies the entire documentation as one Markdown file (`llms-full.txt`,
// produced by `@signalwire/docusaurus-plugin-llms-txt` at build time), so it
// only works against a production build/serve — in `docusaurus start` that
// file does not exist yet and the button reports "Unavailable".

type CopyState = "idle" | "copied" | "error";

function LlmDocumentationButton(): React.JSX.Element {
  const [state, setState] = useState<CopyState>("idle");
  // Resolved against the site baseUrl, the same way every other asset link is.
  const llmsFullUrl = useBaseUrl("/llms-full.txt");

  const onClick = async () => {
    try {
      const res = await fetch(llmsFullUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await navigator.clipboard.writeText(await res.text());
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2000);
  };

  const label =
    state === "copied"
      ? "Copied!"
      : state === "error"
        ? "Unavailable"
        : "LLM Documentation";

  return (
    <button
      type="button"
      className="copyMarkdownButton"
      onClick={onClick}
      aria-label="Copy the entire documentation as Markdown for LLMs"
    >
      {label}
    </button>
  );
}

export default function Root({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      {children}
      <BrowserOnly>{() => <LlmDocumentationButton />}</BrowserOnly>
    </>
  );
}
