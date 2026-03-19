import figma from "@figma/code-connect";

import { SidebarDAODropdown } from "@/shared/components/design-system/navigation/sidebar-dao-dropdown/SidebarDAODropdown";

figma.connect(
  SidebarDAODropdown,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=9221-19472",
  {
    props: {
      isCollapsed: figma.boolean("isCollapsed"),
    },
    example: ({ isCollapsed }) => (
      <SidebarDAODropdown
        label="Uniswap"
        avatar={<div className="bg-surface-contrast size-6 rounded-full" />}
        isCollapsed={isCollapsed}
      />
    ),
  },
);
