"use client";

import { ArrowRight, Send } from "lucide-react";

export const TelegramBotMessage = () => {
  return (
    <div className="flex gap-3 items-center tracking-wider sm:flex-row">
      <Send className="size-4 text-white" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex gap-3">
          <span className="font-roboto font-normal text-white">
            RECEIVE REAL-TIME UNISWAP SECURITY UPDATES.
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <a
            href={`https://t.me/anticapture_bot`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-normal hover:text-tangerine/80"
          >
            JOIN OUR TELEGRAM BOT
          </a>
          <ArrowRight className="size-4" />
        </div>
      </div>
    </div>
  );
};
