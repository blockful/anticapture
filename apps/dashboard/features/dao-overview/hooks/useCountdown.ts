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
    ...calculateTimeLeft(targetTimestamp),
    isLoading: true,
  }));

  const updateCountdown = useCallback(() => {
    setTimeLeft({
      ...calculateTimeLeft(targetTimestamp),
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

// time difference between now and targetTimestamp
function calculateTimeLeft(targetTimestamp: number = 0): CountdownTime {
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

  const now = Math.floor(Date.now() / 1000);
  const diffSeconds = targetTimestamp - now;

  if (diffSeconds <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLoading: false,
    };
  }

  const days = Math.floor(diffSeconds / (60 * 60 * 24));
  const hours = Math.floor((diffSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(diffSeconds % 60);

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    isLoading: false,
  };
}
