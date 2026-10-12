import { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** A flat surface separated from the page by a hairline, never a shadow. */
export const Card = ({ title, description, actions, children, className = "" }: CardProps) => (
  <section className={`rounded-card border border-hairline bg-surface ${className}`}>
    {(title || actions) && (
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div>
          {title && <h2 className="text-base font-medium text-ink">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);
