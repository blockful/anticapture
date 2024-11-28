"use client";

import { useEffect, useState } from "react";

export const AnimatedNumber = ({ num }: { num: number }) => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (counter < num) {
      setCounter(counter + 1);
    }
  }, [counter]);

  return <>{counter}</>;
};
