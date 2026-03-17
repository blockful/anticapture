import { AlertTriangle } from "lucide-react";

import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";

export const ShutterAttackBanner = () => {
  return (
    <BannerAlert
      icon={<AlertTriangle className="size-4" />}
      text="$3M governance attack detected and mitigated on Shutter DAO."
      links={[
        {
          url: "https://shutternetwork.discourse.group/t/security-emergency-governance-hardening-attack-prevention/804",
          text: "Read the details",
          openInNewTab: true,
        },
        {
          url: "/shu",
          text: "Explore Shutter data",
          openInNewTab: false,
        },
      ]}
      storageKey="shutter-attack-banner"
      persist={false}
    />
  );
};
