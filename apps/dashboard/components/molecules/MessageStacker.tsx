"use client";

import { X } from "lucide-react";
import { useMessageStack } from "@/hooks/useMessageStack";

export interface Message {
  id: string;
  content: React.ReactNode;
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
    <div className="flex w-full items-center justify-between gap-2 bg-[#2C1810] px-4 py-3 text-sm text-tangerine sm:rounded-lg">
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
    <div className="flex w-full flex-col gap-2">
      {visibleMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onClose={() => handleCloseMessage(message.id)}
        />
      ))}
    </div>
  );
};
