import type {
  UserApiKey,
  UserApiKeyUsage,
} from "@/shared/services/user-api/apiKeysClient";

const WINDOW_DAYS = 30;
const SERIES_COLORS = [
  "#0080bc",
  "#15803d",
  "#f472b6",
  "#ca8a04",
  "#7c3aed",
  "#0f766e",
  "#dc2626",
  "#4f46e5",
  "#65a30d",
  "#c2410c",
];

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const toUtcDay = (date: Date): string => date.toISOString().slice(0, 10);

const buildDays = (today: Date): string[] => {
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  return Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (WINDOW_DAYS - 1 - index));
    return toUtcDay(date);
  });
};

export const transformApiKeyUsage = (
  usage: UserApiKeyUsage[],
  keys: Pick<UserApiKey, "id" | "label">[],
  today: Date,
  selectedKeyId = "all",
) => {
  const days = buildDays(today);
  const visibleKeys =
    selectedKeyId === "all"
      ? keys
      : keys.filter(({ id }) => id === selectedKeyId);
  const labelCounts = new Map<string, number>();
  for (const key of keys) {
    labelCounts.set(key.label, (labelCounts.get(key.label) ?? 0) + 1);
  }

  const counts = new Map<string, number>();
  for (const row of usage) {
    const bucket = `${row.keyId}:${row.day}`;
    counts.set(bucket, (counts.get(bucket) ?? 0) + row.count);
  }

  const colorByKey = new Map(
    keys.map(({ id }, index) => [
      id,
      SERIES_COLORS[index % SERIES_COLORS.length]!,
    ]),
  );
  const series = visibleKeys.map((key) => ({
    name:
      labelCounts.get(key.label) === 1
        ? key.label
        : `${key.label} (${key.id.slice(0, 6)})`,
    data: days.map((day) => counts.get(`${key.id}:${day}`) ?? 0),
    color: colorByKey.get(key.id)!,
  }));

  return {
    xAxisLabels: days.map((day) =>
      dayFormatter.format(new Date(`${day}T00:00:00Z`)),
    ),
    series,
    hasUsage: series.some(({ data }) => data.some((count) => count > 0)),
  };
};
