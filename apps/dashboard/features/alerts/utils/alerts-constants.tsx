import {
  DiscordColorIcon,
  SlackColorIcon,
  TelegramColorIcon,
} from "@/shared/components/icons";
import {
  ANTICAPTURE_SLACK_BOT,
  ANTICAPTURE_TELEGRAM_BOT,
} from "@/shared/constants/social-media";
import { JSX, ReactNode, SVGProps } from "react";
import { AlertAvailability } from "@/features/alerts/types";

export interface AlertItem {
  title: string;
  description: ReactNode;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  availability: AlertAvailability;
  link: string;
  active: boolean;
}

export const ALERTS_ITEMS: AlertItem[] = [
  {
    title: "Telegram",
    description: (
      <>You&apos;re in crypto, so real-time governance alerts is a must.</>
    ),
    icon: TelegramColorIcon,
    availability: AlertAvailability.AVAILABLE,
    link: ANTICAPTURE_TELEGRAM_BOT,
    active: true,
  },
  {
    title: "Slack",
    description: (
      <>Receive direct messages of your preferred DAOs governance updates.</>
    ),
    icon: SlackColorIcon,
    availability: AlertAvailability.AVAILABLE,
    link: ANTICAPTURE_SLACK_BOT,
    active: true,
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
    availability: AlertAvailability.COMING_SOON,
    link: "/",
    active: false,
  },
];
