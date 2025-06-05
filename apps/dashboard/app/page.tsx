import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HomeTemplate } from "@/templates";
import { HeaderSidebar } from "@/widgets";

export default function Home() {
  return (
    <div className="bg-darkest dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <HeaderMobile />
        </div>
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <HomeTemplate />
          </div>
        </div>
      </main>
    </div>
  );
}
