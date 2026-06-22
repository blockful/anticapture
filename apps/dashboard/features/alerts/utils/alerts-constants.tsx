import type { JSX, SVGProps } from "react";

import {
  DiscordColorIcon,
  SlackColorIcon,
  TelegramColorIcon,
} from "@/shared/components/icons";
import {
  ANTICAPTURE_SLACK_BOT,
  ANTICAPTURE_TELEGRAM_BOT,
} from "@/shared/constants/social-media";

export enum AlertAvailability {
  AVAILABLE = "Available",
  COMING_SOON = "Coming Soon",
}

export interface AlertItem {
  title: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  availability: AlertAvailability;
  link: string;
  active: boolean;
}

export const ALERTS_ITEMS: AlertItem[] = [
  {
    title: "Telegram",
    icon: TelegramColorIcon,
    availability: AlertAvailability.AVAILABLE,
    link: ANTICAPTURE_TELEGRAM_BOT,
    active: true,
  },
  {
    title: "Slack",
    icon: SlackColorIcon,
    availability: AlertAvailability.AVAILABLE,
    link: ANTICAPTURE_SLACK_BOT,
    active: true,
  },
  {
    title: "Discord",
    icon: DiscordColorIcon,
    availability: AlertAvailability.COMING_SOON,
    link: "/",
    active: false,
  },
];
