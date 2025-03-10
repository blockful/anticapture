import { useState, useEffect } from "react";

type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function useCountdown(targetTimestamp?: number): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(
    calculateTimeLeft(targetTimestamp ?? 0),
  );

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp <= 0) {
      setTimeLeft({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTimestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return timeLeft;
}

function calculateTimeLeft(targetTimestamp?: number): CountdownTime {
  if (!targetTimestamp) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = targetTimestamp - now;

  console.log("Debug countdown:", {
    targetTimestamp,
    now,
    diff,
    targetDate: new Date(targetTimestamp * 1000).toISOString(),
    currentDate: new Date(now * 1000).toISOString(),
    calculatedDays: Math.floor(diff / (60 * 60 * 24)),
    expectedDays: 420,
  });

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = diff % 60;

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
  };
}
