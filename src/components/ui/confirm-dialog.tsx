"use client";

import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import { Button } from "./button";
import { FormError } from "./form-error";
import { useConfirmDialog } from "./use-confirm-dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Shown on the confirm button while the action runs, e.g. "Deleting…". */
  pendingLabel: string;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Asks before a destructive action. The page behind is blocked until it closes. */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  pendingLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { dialogRef, onCancelEvent, onBackdropClick } = useConfirmDialog(open, isPending, onCancel);
  const titleId = useId();

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancelEvent}
      onClick={onBackdropClick}
      aria-labelledby={titleId}
      className="m-auto w-full max-w-md rounded-card border border-hairline bg-surface p-0 text-start text-ink backdrop:bg-scrim"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-full bg-danger-tint p-2 text-danger">
            <TriangleAlert size={18} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-medium text-ink">
              {title}
            </h2>
            <p className="mt-1 whitespace-normal break-words text-sm text-muted">{message}</p>
          </div>
        </div>
        {error && (
          <div className="mt-4">
            <FormError message={error} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending} autoFocus>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
};
