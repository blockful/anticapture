import type {
  UserApiKey,
  UserApiKeyUsage,
} from "@/shared/services/user-api/apiKeysClient";

import { transformApiKeyUsage } from "./transform";

const keys: Pick<UserApiKey, "id" | "label">[] = [
  { id: "11111111-1111-1111-1111-111111111111", label: "Agent" },
  { id: "22222222-2222-2222-2222-222222222222", label: "Agent" },
];

const usage: UserApiKeyUsage[] = [
  {
    keyId: keys[0]!.id,
    label: keys[0]!.label,
    day: "2026-07-19",
    count: 2,
  },
  {
    keyId: keys[0]!.id,
    label: keys[0]!.label,
    day: "2026-07-19",
    count: 3,
  },
  {
    keyId: keys[1]!.id,
    label: keys[1]!.label,
    day: "2026-07-20",
    count: 7,
  },
  {
    keyId: keys[0]!.id,
    label: keys[0]!.label,
    day: "2026-06-20",
    count: 99,
  },
];

describe("transformApiKeyUsage", () => {
  it("zero-fills 30 UTC days, aggregates rows, and disambiguates labels", () => {
    const result = transformApiKeyUsage(
      usage,
      keys,
      new Date("2026-07-20T12:00:00Z"),
    );

    expect(result).toEqual({
      xAxisLabels: [
        "Jun 21",
        "Jun 22",
        "Jun 23",
        "Jun 24",
        "Jun 25",
        "Jun 26",
        "Jun 27",
        "Jun 28",
        "Jun 29",
        "Jun 30",
        "Jul 1",
        "Jul 2",
        "Jul 3",
        "Jul 4",
        "Jul 5",
        "Jul 6",
        "Jul 7",
        "Jul 8",
        "Jul 9",
        "Jul 10",
        "Jul 11",
        "Jul 12",
        "Jul 13",
        "Jul 14",
        "Jul 15",
        "Jul 16",
        "Jul 17",
        "Jul 18",
        "Jul 19",
        "Jul 20",
      ],
      series: [
        {
          name: "Agent (111111)",
          data: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 5, 0,
          ],
          color: "#0080bc",
        },
        {
          name: "Agent (222222)",
          data: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 7,
          ],
          color: "#15803d",
        },
      ],
      hasUsage: true,
    });
  });

  it("filters one key while preserving its color and empty state", () => {
    const result = transformApiKeyUsage(
      [],
      keys,
      new Date("2026-07-20T12:00:00Z"),
      keys[1]!.id,
    );

    expect(result).toEqual({
      xAxisLabels: [
        "Jun 21",
        "Jun 22",
        "Jun 23",
        "Jun 24",
        "Jun 25",
        "Jun 26",
        "Jun 27",
        "Jun 28",
        "Jun 29",
        "Jun 30",
        "Jul 1",
        "Jul 2",
        "Jul 3",
        "Jul 4",
        "Jul 5",
        "Jul 6",
        "Jul 7",
        "Jul 8",
        "Jul 9",
        "Jul 10",
        "Jul 11",
        "Jul 12",
        "Jul 13",
        "Jul 14",
        "Jul 15",
        "Jul 16",
        "Jul 17",
        "Jul 18",
        "Jul 19",
        "Jul 20",
      ],
      series: [
        {
          name: "Agent (222222)",
          data: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0,
          ],
          color: "#15803d",
        },
      ],
      hasUsage: false,
    });
  });
});
