import figma from "@figma/code-connect";

import { Sidebar } from "@/shared/components/design-system/navigation/sidebar/Sidebar";

figma.connect(
  Sidebar,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=7896-9014",
  {
    props: {
      isCollapsed: figma.enum("isCollapsed", {
        true: true,
        false: false,
      }),
    },
    example: ({ isCollapsed }) => (
      <Sidebar isCollapsed={isCollapsed}>
        <>
          {/* <SidebarNavItem icon={PieChart} label="Overview" isActive /> */}
        </>
      </Sidebar>
    ),
  },
);
