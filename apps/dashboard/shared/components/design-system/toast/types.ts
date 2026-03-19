export type ToastProps = {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onClose: () => void;
};
