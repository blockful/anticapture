import { DaysEnum } from "@/lib/enums";

const SECONDS_IN_DAY = 86400;

export const secondsToDays = (seconds: number | DaysEnum): number => {
  return Math.floor(seconds / SECONDS_IN_DAY);
};
