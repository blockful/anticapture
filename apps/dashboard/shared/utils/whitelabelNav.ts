import {
  Bell,
  Briefcase,
  DollarSign,
  Landmark,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { WHITELABEL_ROUTES } from "@/shared/utils/whitelabel";

// Single source of truth for the whitelabel nav — consumed by both the desktop
// sidebar (WhitelabelSidebar) and the mobile drawer (WhitelabelShell) so the two
// can't drift when entries are added/reordered/re-iconed.
export const WHITELABEL_NAV_ITEMS = [
  {
    label: "Proposals",
    page: WHITELABEL_ROUTES.proposals,
    icon: Landmark,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].governancePage,
  },
  {
    label: "Holders & Delegates",
    page: WHITELABEL_ROUTES.holdersAndDelegates,
    icon: Users,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].dataTables,
  },
  {
    label: "Activity Feed",
    page: WHITELABEL_ROUTES.activityFeed,
    icon: Newspaper,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].activityFeed,
  },
  {
    label: "Service Providers",
    page: WHITELABEL_ROUTES.serviceProviders,
    icon: Briefcase,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].serviceProviders,
  },
  {
    label: "Revenue",
    page: WHITELABEL_ROUTES.revenue,
    icon: DollarSign,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].revenue,
  },
  {
    label: "Notifications",
    page: WHITELABEL_ROUTES.notifications,
    icon: Bell,
    enabled: () => true,
  },
  {
    label: "Governance Settings",
    page: WHITELABEL_ROUTES.governanceSettings,
    icon: Settings,
    enabled: () => true,
  },
] as const;
