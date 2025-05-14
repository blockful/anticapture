"use client";

import { useCallback, useEffect, useState } from "react";
import { Message } from "@/widgets/MessageStacker";

const CLOSED_MESSAGES_KEY = "closed_messages";

export const useMessageStack = (messages: Message[]) => {
  const [closedMessageIds, setClosedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load closed messages from localStorage on mount
  useEffect(() => {
    const loadClosedMessages = () => {
      try {
        const stored = localStorage.getItem(CLOSED_MESSAGES_KEY);
        if (stored) {
          setClosedMessageIds(new Set(JSON.parse(stored)));
        }
      } catch (error) {
        console.error("Error loading closed messages:", error);
      }
      setIsLoaded(true);
    };

    loadClosedMessages();
  }, []);

  // Save to localStorage whenever closedMessageIds changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        CLOSED_MESSAGES_KEY,
        JSON.stringify(Array.from(closedMessageIds)),
      );
    }
  }, [closedMessageIds, isLoaded]);

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
