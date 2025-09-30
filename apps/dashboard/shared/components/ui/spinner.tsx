import { Loader2 } from "lucide-react";

const Spinner = ({ label }: { label?: string }) => (
  <div className="flex w-full items-center justify-center">
    <Loader2 className="size-4 animate-spin" />
    {label && <span className="ml-2">{label}</span>}
  </div>
);

export default Spinner;
