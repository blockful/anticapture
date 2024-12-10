"use client";

import { useState } from "react";

enum OPTION {
  YES = "Yes",
  NO = "No",
}

export const Switcher = () => {
  const [isSwitched, setIsSwitched] = useState<OPTION>(OPTION.YES);

  return (
    <div className="flex h-full w-full gap-1 rounded-lg bg-[#27272a] p-1 transition-all duration-300 ease-in-out">
      <button
        className={`h-full w-full rounded-lg px-2 text-center ${isSwitched === OPTION.YES ? "bg-[#4ade80] text-black" : "bg-[#27272a] text-white"}`}
        onClick={() => setIsSwitched(OPTION.YES)}
      >
        {OPTION.YES}
      </button>
      <button
        className={`h-full w-full rounded-lg px-2 text-center ${isSwitched === OPTION.NO ? "bg-[#F87171] text-black" : "bg-[#27272a] text-white"}`}
        onClick={() => setIsSwitched(OPTION.NO)}
      >
        {OPTION.NO}
      </button>
    </div>
  );
};
