import { CircleAlert } from "lucide-react";

type FormErrorProps = {
  message?: string;
};

export const FormError = ({ message }: FormErrorProps) =>
  message ? (
    <p className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger">
      <CircleAlert size={16} />
      {message}
    </p>
  ) : null;
