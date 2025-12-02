import {
  DiscordColorIcon,
  SlackColorIcon,
  TelegramColorIcon,
} from "@/shared/components/icons";
import { ANTICAPTURE_TELEGRAM_BOT } from "@/shared/constants/social-media";
import { JSX, ReactNode, SVGProps } from "react";

export interface AlertItem {
  title: string;
  description: ReactNode;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  availability: "available" | "coming soon";
  link: string;
}

export const ALERTS_ITEMS: AlertItem[] = [
  {
    title: "Telegram",
    description: (
      <>You&apos;re in crypto, so real-time governance alerts is a must.</>
    ),
    icon: TelegramColorIcon,
    availability: "available",
    link: ANTICAPTURE_TELEGRAM_BOT,
  },
  {
    title: "Slack",
    description: (
      <>Receive direct messages of your preferred DAOs governance updates.</>
    ),
    icon: SlackColorIcon,
    availability: "available",
    link: ANTICAPTURE_TELEGRAM_BOT,
  },
  {
    title: "Discord",
    description: (
      <>
        Beyond that 2021 NFT server, you can get real-time governance alerts
        that actually matter.
      </>
    ),
    icon: DiscordColorIcon,
    availability: "coming soon",
    link: ANTICAPTURE_TELEGRAM_BOT,
  },
];
