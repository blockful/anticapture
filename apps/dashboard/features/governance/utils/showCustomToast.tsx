import toast from "react-hot-toast";

import { Toast } from "@/shared/components/design-system/toast";

export const showCustomToast = (message: string, type: "success" | "error") => {
  toast.custom(
    (t: { id: string; visible: boolean }) => (
      <Toast
        message={message}
        type={type}
        visible={t.visible}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 4000,
      position: "top-center",
    },
  );
};
