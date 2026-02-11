import { cn } from "@/shared/utils";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircle2 className="size-icon-xs shrink-0" />,
    bgColor: "bg-success",
  },
  error: {
    icon: <AlertTriangle className="size-icon-xs shrink-0" />,
    bgColor: "bg-error",
  },
};

export const Toast = ({ message, type, visible, onClose }: ToastProps) => {
  const config = toastConfig[type];

  return (
    <div
      className={cn(
        "flex min-w-[400px] max-w-[500px] items-center justify-between gap-4 px-4 py-3 text-black shadow-lg",
        config.bgColor,
        visible ? "animate-toast-slide-in" : "animate-toast-slide-out",
      )}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <span className="font-inter text-base font-normal leading-6">
          {message}
        </span>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 cursor-pointer rounded-sm p-1 transition-opacity hover:opacity-70"
        aria-label="Close notification"
        type="button"
      >
        <X className="size-icon-xxs" />
      </button>
    </div>
  );
};
