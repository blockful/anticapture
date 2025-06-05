"use client";

import { X } from "lucide-react";
import { useMessageStack } from "@/shared/hooks/useMessageStack";
import { ReactNode } from "react";

export interface Message {
  id: string;
  content: ReactNode;
}

interface MessageStackerProps {
  messages: Message[];
  onClose?: (messageId: string) => void;
}

const MessageItem = ({
  message,
  onClose,
}: {
  message: Message;
  onClose: () => void;
}) => {
  return (
    <div className="text-tangerine flex w-full items-center justify-between gap-2 bg-[#2C1810] px-4 py-3 text-sm">
      {message.content}
      <button
        onClick={onClose}
        className="text-tangerine hover:text-tangerine/80"
        aria-label="Close message"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export const MessageStacker = ({ messages }: MessageStackerProps) => {
  const { visibleMessages, handleCloseMessage, isLoaded } =
    useMessageStack(messages);

  if (!isLoaded || visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="w-full gap-2 px-4 pt-4 sm:px-3 sm:py-2">
      <div className="flex w-full flex-col gap-2">
        {visibleMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onClose={() => handleCloseMessage(message.id)}
          />
        ))}
      </div>
    </div>
  );
};
