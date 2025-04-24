export interface Message {
  id: string;
  content: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  link?: {
    text: string;
    url: string;
  };
}

export interface MessageStackerProps {
  messages: Message[];
  onClose?: (messageId: string) => void;
} 