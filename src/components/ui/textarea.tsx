import { Ref, TextareaHTMLAttributes } from "react";
import { INPUT_CLASSES } from "@/components/ui/input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
  invalid?: boolean;
};

export const Textarea = ({ className = "", invalid = false, ...props }: TextareaProps) => (
  <textarea
    className={`${INPUT_CLASSES} min-h-24 ${invalid ? "border-danger" : "border-hairline focus:border-primary"} ${className}`}
    {...props}
  />
);
