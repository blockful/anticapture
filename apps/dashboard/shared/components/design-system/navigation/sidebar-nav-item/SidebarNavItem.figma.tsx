import figma from "@figma/code-connect";
import { PieChart } from "lucide-react";

import { SidebarNavItem } from "@/shared/components/design-system/navigation/sidebar-nav-item/SidebarNavItem";

figma.connect(
  SidebarNavItem,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=2810-11810",
  {
    props: {
      isActive: figma.boolean("isActive"),
      isCollapsed: figma.boolean("isCollapsed"),
      isNew: figma.boolean("isNew"),
    },
    example: ({ isActive, isCollapsed, isNew }) => (
      <SidebarNavItem
        icon={PieChart}
        label="Overview"
        isActive={isActive}
        isCollapsed={isCollapsed}
        isNew={isNew}
      />
    ),
  },
);
