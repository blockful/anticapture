import { useState, useEffect, useCallback } from "react";

type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  isLoading: boolean;
};

export function useCountdown(targetTimestamp?: number): CountdownTime {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(() => ({
    ...calculateTimeLeft(targetTimestamp ?? 0),
    isLoading: true,
  }));

  const updateCountdown = useCallback(() => {
    setTimeLeft({
      ...calculateTimeLeft(targetTimestamp ?? 0),
      isLoading: false,
    });
  }, [targetTimestamp]);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp <= 0) {
      setTimeLeft({
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isLoading: false,
      });
      return;
    }

    // Only start the countdown on the client side
    if (!isClient) return;

    // Initial calculation
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp, updateCountdown, isClient]);

  return timeLeft;
}

function calculateTimeLeft(targetTimestamp?: number): CountdownTime {
  if (!targetTimestamp) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLoading: false,
    };
  }

  const targetMs = targetTimestamp;
  const now = Date.now();
  const diffMs = targetMs - now;

  if (diffMs <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLoading: false,
    };
  }

  const days = Math.floor(diffMs / 1000);
  const hours = Math.floor(
    (diffMs % 1000) / 1000,
  );
  const minutes = Math.floor(
    (diffMs % 1000) / 1000,
  );
  const seconds = Math.floor(
    (diffMs % 1000) / 1000,
  );

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    isLoading: false,
  };
}
