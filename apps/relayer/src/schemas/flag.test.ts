import { describe, expect, it } from "vitest";

import { envFlag } from "@/schemas/flag";

describe("envFlag", () => {
  it.each(["true", "TRUE", " True ", "1", "yes", "YES", "on", "On"])(
    "reads %j as on",
    (value) => {
      expect(envFlag.parse(value)).toBe(true);
    },
  );

  it.each([undefined, "", "  ", "false", "FALSE", "0", "no", "off"])(
    "reads %j as off",
    (value) => {
      expect(envFlag.parse(value)).toBe(false);
    },
  );

  // A typo must stop the relayer at boot, not leave the kill switch off.
  it.each(["ture", "paused", "2", "enabled"])("refuses %j", (value) => {
    expect(envFlag.safeParse(value).success).toBe(false);
  });
});
