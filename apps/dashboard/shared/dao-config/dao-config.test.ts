import daoConfigByDaoId from "@/shared/dao-config";
import { isFeatureEnabledForDao } from "@/shared/utils/dao-navigation";

describe("DAO configuration validation", () => {
  const daoEntries = Object.entries(daoConfigByDaoId);

  it.each(daoEntries)(
    "%s: initialPage (if set) must point to an enabled feature",
    (_daoId, config) => {
      if (!config.initialPage) return;

      const isEnabled = isFeatureEnabledForDao(config, config.initialPage);
      expect(isEnabled).toBe(true);
    },
  );

  it.each(daoEntries)("%s: initialPage must not be '/'", (_daoId, config) => {
    // "/" is the default — setting it explicitly is a no-op bug
    expect(config.initialPage).not.toBe("/");
  });
});
