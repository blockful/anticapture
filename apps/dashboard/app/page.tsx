import { HomeTemplate } from "@/components/04-templates";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance dashboard",
  keywords: ["governance", "dao", "data"],
};

export default function Home() {
  return (
    <>
      <HomeTemplate />
    </>
  );
}
