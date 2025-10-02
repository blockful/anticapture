export const DaoOverviewSkeleton = () => {
  return (
    <div className="flex min-h-screen w-full flex-col gap-8 border-b-2 border-b-white/10 px-4 sm:gap-6 sm:border-none sm:p-5">
      <div className="flex-1 space-y-4">
        {/* First row - Full width card */}
        <div className="bg-surface-contrast h-32 w-full animate-pulse rounded-lg" />

        {/* Second row - Two equal cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-surface-contrast h-56 animate-pulse rounded-lg" />
          <div className="bg-surface-contrast h-56 animate-pulse rounded-lg" />
        </div>

        {/* Third row - Four equal cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface-contrast h-[90px] animate-pulse rounded-lg" />
          <div className="bg-surface-contrast h-[90px] animate-pulse rounded-lg" />
          <div className="bg-surface-contrast h-[90px] animate-pulse rounded-lg" />
          <div className="bg-surface-contrast h-[90px] animate-pulse rounded-lg" />
        </div>

        {/* Fourth row - Two equal cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-surface-contrast h-56 animate-pulse rounded-lg" />
          <div className="bg-surface-contrast h-56 animate-pulse rounded-lg" />
        </div>

        {/* Fifth row - Two equal cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-surface-contrast h-56 animate-pulse rounded-lg" />
          <div className="bg-surface-contrast h-56 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
};
