import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-hairline bg-surface text-ink hover:bg-hover",
  danger: "border border-danger/30 bg-surface text-danger hover:bg-danger-tint",
  ghost: "text-muted hover:bg-hover hover:text-ink",
};

export const Button = ({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
    {...props}
  />
);
