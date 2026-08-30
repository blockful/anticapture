import type { Humanized } from "@/shared/services/decoder/types";

/**
 * Parameter names that mark a uint as a length of time. Value-range heuristics
 * alone would mislabel token amounts, so a name (or known setter) hint is
 * required before this humanizer runs.
 */
export const DURATION_NAME_HINT = /delay|duration|period|deadline$|eta$/i;

/** Known setters whose single uint argument is always a duration in seconds. */
export const DURATION_FUNCTION_HINT = new Set([
  "updateDelay",
  "setVotingDelay",
  "setVotingPeriod",
  "setDelay",
]);

const UNITS: Array<{ label: string; seconds: bigint }> = [
  { label: "year", seconds: 31_536_000n },
  { label: "week", seconds: 604_800n },
  { label: "day", seconds: 86_400n },
  { label: "hour", seconds: 3_600n },
  { label: "minute", seconds: 60n },
];

const grouped = (value: bigint): string =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * "315360000" -> "10 years = 315,360,000 seconds". Only exact whole-unit
 * readings qualify: the "=" must hold, so anything else returns null and the
 * caller falls through to the plain grouped number.
 */
export const humanizeDuration = (seconds: bigint): Humanized | null => {
  if (seconds < 60n) return null;

  for (const unit of UNITS) {
    if (seconds < unit.seconds || seconds % unit.seconds !== 0n) continue;
    const count = seconds / unit.seconds;
    const plural = count === 1n ? unit.label : `${unit.label}s`;
    return {
      kind: "duration",
      text: `${grouped(count)} ${plural} = ${grouped(seconds)} seconds`,
    };
  }
  return null;
};
