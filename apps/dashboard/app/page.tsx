import { HeaderSidebar2 } from "@/components/molecules/HeaderSidebar2";
import { HeaderNavMobile } from "@/components/molecules/HeaderNavMobile";
import { HomeTemplate } from "@/components/templates";
import { HeaderMobile } from "@/components/molecules";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <HeaderSidebar2 />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="block sm:hidden">
          <HeaderMobile />
        </div>
        <HomeTemplate />
      </main>
    </div>
  );
}
