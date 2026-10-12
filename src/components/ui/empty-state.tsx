import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-hairline px-6 py-12 text-center">
    <p className="text-base text-ink">{title}</p>
    {description && <p className="max-w-md text-sm text-muted">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
