const EXTRA_COLORS = [
  "#ec762e", // orange (brand)
  "#facc15", // yellow
  "#818cf8", // indigo
  "#38bdf8", // sky
  "#fb7185", // rose
  "#34d399", // emerald
  "#a78bfa", // violet
  "#f472b6", // pink
];

export const getOffchainChoiceColor = (
  label: string,
  index: number,
): string => {
  const lower = label.toLowerCase();
  if (lower === "for") return "var(--color-success)";
  if (lower === "against") return "var(--color-error)";
  if (lower === "abstain") return "var(--color-secondary)";
  return EXTRA_COLORS[index % EXTRA_COLORS.length] ?? EXTRA_COLORS[0]!;
};
