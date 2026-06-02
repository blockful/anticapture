import React, { useEffect, useState } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useLocation } from "@docusaurus/router";

// API pages render via `@theme/ApiItem/Layout` and guide pages via
// `@theme/DocItem/Layout`, so no single layout swizzle covers both. Injecting
// the button here in `Root` (which wraps the whole app) puts it on every page.
//
// The Markdown twins are produced by `@signalwire/docusaurus-plugin-llms-txt`
// at build time, so this button only works against a production build/serve —
// in `docusaurus start` the `.md` files do not exist and the button reports
// "Unavailable".

type CopyState = "idle" | "copied" | "error";

function CopyMarkdownButton(): React.JSX.Element {
  const location = useLocation();
  const [state, setState] = useState<CopyState>("idle");

  // Reset the label whenever the user navigates to another page.
  useEffect(() => setState("idle"), [location.pathname]);

  const onClick = async () => {
    try {
      // Use the real browser path (not the router path) so the fetch resolves
      // correctly even when the site is served behind a reverse-proxy prefix.
      const path = window.location.pathname;
      const mdPath = path.endsWith("/") ? `${path}index.md` : `${path}.md`;

      const res = await fetch(mdPath);
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
        : "Copy as Markdown";

  return (
    <button
      type="button"
      className="copyMarkdownButton"
      onClick={onClick}
      aria-label="Copy this page as Markdown"
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
      <BrowserOnly>{() => <CopyMarkdownButton />}</BrowserOnly>
    </>
  );
}
