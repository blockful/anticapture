"use client";

import { useState } from "react";

export const Switcher = ({ switched }: { switched: boolean | undefined }) => {
  const [isSwitched, setIsSwitched] = useState<boolean>(
    switched !== undefined ? switched : true,
  );

  return (
    <div className="flex h-full w-full gap-1 rounded-lg bg-[#27272a] p-1 transition-all duration-300 ease-in-out">
      <button
        className={`h-full w-full cursor-default rounded-lg px-2 text-center ${!!isSwitched ? "bg-[#4ade80] text-black" : "bg-[#27272a] text-white"}`}
      >
        Yes
      </button>
      <button
        className={`h-full w-full cursor-default rounded-lg px-2 text-center ${!isSwitched ? "bg-[#F87171] text-black" : "bg-[#27272a] text-white"}`}
      >
        No
      </button>
    </div>
  );
};
