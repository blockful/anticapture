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
  if (countdown.days > 0) parts.push(`${countdown.days}days`);
  if (countdown.hours > 0) parts.push(`${countdown.hours}hours`);
  if (countdown.minutes > 0) parts.push(`${countdown.minutes}hours`);
  if (countdown.seconds > 0) parts.push(`${countdown.seconds}seconds`);

  return parts.join(" ");
}
