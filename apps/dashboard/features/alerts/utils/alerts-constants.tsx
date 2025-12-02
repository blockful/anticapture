import { TelegramIcon } from "@/shared/components/icons";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";
import { ComponentType, ReactNode } from "react";

export interface AlertItem {
  title: string;
  description: ReactNode;
  icon: ComponentType<{ className?: string }>;
  availability: "available" | "coming soon";
  link: string;
}

export const ALERTS_ITEMS: AlertItem[] = [
  {
    title: "Telegram",
    description: (
      <>You&apos;re in crypto, so real-time governance alerts is a must.</>
    ),
    icon: TelegramIcon,
    availability: "available",
    link: ANTICAPTURE_TELEGRAM_BOT,
  },
];
