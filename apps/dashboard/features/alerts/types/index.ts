export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface Alert {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface AlertCardProps {
  alert: Alert;
  onMarkAsRead?: (alertId: string) => void;
}

export enum AlertAvailability {
  AVAILABLE = "available",
  COMING_SOON = "coming soon",
}
