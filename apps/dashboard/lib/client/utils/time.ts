type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  isLoading: boolean;
};

export function formatCountdown(countdown: CountdownTime): string {
  if (countdown.isLoading) return "Loading...";
  if (countdown.expired) return "Expired";

  const parts = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  if (countdown.hours > 0) parts.push(`${countdown.hours}h`);
  if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`);
  if (countdown.seconds > 0) parts.push(`${countdown.seconds}s`);

  return parts.join(" ");
}
