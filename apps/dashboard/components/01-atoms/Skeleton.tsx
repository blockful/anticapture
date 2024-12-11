"use client";

export const Skeleton = () => {
  return (
    <div className="card-container-about">
      <div className="card-header-about">
        <div className="skeleton-icon" />
        <div className="skeleton-text h-6 w-1/2" />
      </div>
      <div className="card-body-about">
        <div className="card-description-about">
          <div className="card-description-title">
            <div className="skeleton-text h-6 w-1/4" />
            <div className="skeleton-text h-4 w-1/2" />
          </div>
          <div className="flex h-full w-full items-center justify-start gap-1.5">
            <div className="flex w-1/2">
              <div className="skeleton-text h-4 w-full" />
            </div>
          </div>
        </div>
        <div className="card-description-about">
          <div className="card-description-title">
            <div className="skeleton-text h-6 w-1/4" />
            <div className="skeleton-text h-4 w-1/2" />
          </div>
          <div className="flex h-full w-full items-center justify-start gap-1.5">
            <div className="flex w-1/2">
              <div className="skeleton-text h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
