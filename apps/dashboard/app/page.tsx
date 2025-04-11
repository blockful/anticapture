import { HeaderMobile, HeaderSidebar } from "@/components/molecules";
import { HomeTemplate } from "@/components/templates";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <HeaderMobile />
        </div>
        <HomeTemplate />
      </main>
    </div>
  );
}
