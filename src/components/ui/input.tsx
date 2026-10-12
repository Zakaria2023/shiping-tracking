import { InputHTMLAttributes, Ref } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
  invalid?: boolean;
};

export const INPUT_CLASSES =
  "w-full rounded-control border bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60";

export const Input = ({ className = "", invalid = false, ...props }: InputProps) => (
  <input
    className={`${INPUT_CLASSES} ${invalid ? "border-danger" : "border-hairline focus:border-primary"} ${className}`}
    {...props}
  />
);
