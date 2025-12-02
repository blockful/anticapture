export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: number;
  daoId?: string;
  daoName?: string;
  link?: string;
  isRead?: boolean;
}

export interface AlertCardProps {
  alert: Alert;
  onMarkAsRead?: (alertId: string) => void;
}
