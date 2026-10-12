import { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
};

/** A label, the control, and the error or hint beneath it. */
export const Field = ({ label, hint, error, htmlFor, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-sm text-muted">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-danger">{error}</p>
    ) : hint ? (
      <p className="text-xs text-faint">{hint}</p>
    ) : null}
  </div>
);
