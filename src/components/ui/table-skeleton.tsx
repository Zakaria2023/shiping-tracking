type TableSkeletonProps = {
  rows?: number;
};

export const TableSkeleton = ({ rows = 6 }: TableSkeletonProps) => (
  <div className="flex flex-col gap-2" aria-hidden>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-12 animate-pulse rounded-control bg-hairline-soft" />
    ))}
  </div>
);
