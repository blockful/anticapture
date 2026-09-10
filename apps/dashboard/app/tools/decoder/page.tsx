import type { Metadata } from "next";

import { DecoderTool } from "@/features/decoder/components/DecoderTool";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

// Platform tool: decoding calldata is not DAO-scoped, so the page lives at the
// root (main sidebar "Decoder" entry), outside any /{daoId} context.
export const metadata: Metadata = {
  title: "Calldata Decoder — Anticapture",
  description:
    "Decode any calldata into typed, human-readable parameters, with recursive Safe, Multicall3 and Timelock unpacking.",
  alternates: { canonical: "/tools/decoder" },
};

export default function DecoderPage() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile className="fixed! top-0" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="mt-14 w-full flex-1 lg:mt-0">
            <DecoderTool />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
