import { SkeletonRow } from "@/shared/components";

interface ChartExceptionStateProps {
  state: "loading" | "error" | "no-data";
  title: string;
  height?: string;
  errorMessage?: string;
  noDataMessage?: string;
  headerContent?: React.ReactNode;
}

export const ChartExceptionState = ({
  state,
  title,
  height = "h-[200px]",
  errorMessage = "Error loading data",
  noDataMessage = "No data available",
  headerContent,
}: ChartExceptionStateProps) => {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div className={`${height} w-full`}>
            <SkeletonRow className={`${height} w-full`} />
          </div>
        );
      case "error":
        return (
          <div
            className={`border-light-dark bg-surface-default text-primary relative flex ${height} w-full items-center justify-center rounded-lg`}
          >
            <div className="text-secondary text-sm">{errorMessage}</div>
          </div>
        );
      case "no-data":
        return (
          <div
            className={`border-light-dark bg-surface-default text-primary relative flex ${height} w-full items-center justify-center rounded-lg`}
          >
            <div className="text-secondary text-sm">{noDataMessage}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-secondary font-mono text-[13px] font-medium uppercase">
          {title}
        </h3>
        {headerContent}
      </div>
      {renderContent()}
    </div>
  );
};
