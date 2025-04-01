import { HeaderSidebar } from "@/components/molecules";
import { HomeTemplate } from "@/components/templates";

export default function Home() {
  return (
    <div className="max-h-screen overflow-auto xl:ml-[330px]">
      <HeaderSidebar />
      <HomeTemplate />
    </div>
  );
}
