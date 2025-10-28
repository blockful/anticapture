import { cn } from "@/shared/utils";
import { CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

export const showCustomToast = (message: string, type: "success" | "error") => {
  toast.custom(
    (t) => (
      <div
        className={cn(
          "flex max-w-[500px] items-center justify-between gap-4 px-6 py-4 text-black shadow-lg transition-all",
          type === "success" ? "bg-success" : "bg-error",
          t.visible ? "animate-enter" : "animate-leave",
        )}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 flex-shrink-0" />
          <span className="font-inter text-base font-normal leading-6">
            {message}
          </span>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 transition-opacity hover:opacity-70"
          aria-label="Close notification"
        >
          <X className="size-5" />
        </button>
      </div>
    ),
    {
      duration: 4000,
      position: "top-center",
    },
  );
};
