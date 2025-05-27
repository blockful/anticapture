"use client";

import { ArrowRight, Send } from "lucide-react";
import { useParams } from "next/navigation";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";

export const TelegramBotMessage = () => {
  const { daoId } = useParams() as { daoId: string };
  return (
    <div className="flex items-center gap-3 tracking-wider sm:flex-row">
      <Send className="text-primary hidden size-4 sm:block" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex gap-3">
          <span className="text-primary font-mono font-normal">
            RECEIVE REAL-TIME{" "}
            {daoConfigByDaoId[
              daoId.toUpperCase() as DaoIdEnum
            ].name.toUpperCase()}{" "}
            <span className="hidden sm:inline">SECURITY</span> UPDATES.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={ANTICAPTURE_TELEGRAM_BOT}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-tangerine/80 font-normal"
          >
            JOIN OUR TELEGRAM BOT
          </a>
          <ArrowRight className="size-4" />
        </div>
      </div>
    </div>
  );
};
