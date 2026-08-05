type DrawerTab = {
  id: string;
};

export const getRenderableDrawerTab = <Tab extends DrawerTab>(
  tabs: Tab[],
  activeTab: string | null,
) => tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
