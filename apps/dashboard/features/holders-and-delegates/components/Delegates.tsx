import { useDelegates } from "@/features/holders-and-delegates";

export const Delegates = () => {
  const { data, loading, error } = useDelegates();

  console.log("Delegates data:", { data, loading, error });

  return (
    <div className="flex">
      <div className="text-white">Delegates</div>
    </div>
  );
};
