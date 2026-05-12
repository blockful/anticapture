"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Message } from "@/widgets/MessageStacker";

const CLOSED_MESSAGES_KEY = "closed_messages";

export const useMessageStack = (messages: Message[]) => {
  const [closedMessageIds, setClosedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoaded, setIsLoaded] = useState(false);
  // Ref so the sync effect doesn't re-run merely because isLoaded changed to true
  const isLoadedRef = useRef(false);

  // Load closed messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLOSED_MESSAGES_KEY);
      if (stored) {
        setClosedMessageIds(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Error loading closed messages:", error);
    }
    isLoadedRef.current = true;
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever closedMessageIds changes (not on the initial load pass)
  useEffect(() => {
    if (!isLoadedRef.current) return;
    localStorage.setItem(
      CLOSED_MESSAGES_KEY,
      JSON.stringify(Array.from(closedMessageIds)),
    );
  }, [closedMessageIds]);

  const handleCloseMessage = useCallback((messageId: string) => {
    setClosedMessageIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });
  }, []);

  // Filter out closed messages
  const visibleMessages = messages.filter(
    (message) => !closedMessageIds.has(message.id),
  );

  return {
    visibleMessages,
    handleCloseMessage,
    isLoaded,
  };
};
