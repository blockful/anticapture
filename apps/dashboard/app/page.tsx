import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HomeTemplate } from "@/templates";
import { HeaderSidebar } from "@/widgets";
import { Footer } from "@/shared/components/design-system/footer/Footer";

export default function Home() {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <HeaderMobile />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full flex-1">
            <HomeTemplate />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
