import type { Metadata } from "next";

import { ApiKeysManager } from "@/features/api-keys";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

// Platform-account feature: keys belong to the signed-in user, not to a DAO,
// so this page lives at the root (main sidebar "API" entry), outside any
// /{daoId} context.
export const metadata: Metadata = {
  title: "API Keys — Anticapture",
  description:
    "Create and manage API keys to query Anticapture from Claude, Cursor, or Codex.",
  alternates: { canonical: "/api-keys" },
  robots: { index: false, follow: false },
};

export default function ApiKeysPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile className="fixed! top-0" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="mt-14 w-full flex-1 lg:mt-0">
            <ApiKeysManager />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
