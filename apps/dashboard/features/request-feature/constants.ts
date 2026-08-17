export const REQUEST_FEATURE_PRIORITIES = [
  { value: "low", label: "Not blocking, just an idea" },
  { value: "normal", label: "Would improve my experience" },
  { value: "high", label: "Blocking part of my work" },
  { value: "urgent", label: "Completely blocking me" },
] as const;

export type RequestFeaturePriority =
  (typeof REQUEST_FEATURE_PRIORITIES)[number]["value"];
