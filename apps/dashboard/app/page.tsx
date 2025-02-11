import { HeaderSidebar } from "@/components/02-molecules";
import { HomeTemplate } from "@/components/04-templates";
import { Metadata } from "next";

export default function Home() {
  return (
    <>
      <HeaderSidebar />
      <HomeTemplate />
    </>
  );
}
