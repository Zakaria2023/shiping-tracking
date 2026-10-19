"use client";

import { Trash2 } from "lucide-react";
import { useDeleteShipment } from "@/app/shipments/use-delete-shipment";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteShipmentButtonProps = {
  uuid: string;
  /** "icon" is the compact form for a table row. */
  variant?: "button" | "icon";
  /** Where to go once it is deleted; stays on the page when left out. */
  afterDelete?: string;
  label?: string;
};

export const DeleteShipmentButton = ({
  uuid,
  variant = "button",
  afterDelete,
  label = "this shipment",
}: DeleteShipmentButtonProps) => {
  const { open, isPending, error, requestDelete, cancel, confirm } = useDeleteShipment(
    uuid,
    afterDelete,
  );

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={requestDelete}
          aria-label={`Delete ${label}`}
          title="Delete"
          className="relative z-10 inline-flex rounded-control p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      ) : (
        <Button variant="danger" onClick={requestDelete}>
          <Trash2 size={16} />
          Delete
        </Button>
      )}
      <ConfirmDialog
        open={open}
        title={`Delete ${label}?`}
        message="Its tracking history and documents are deleted with it. This cannot be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        isPending={isPending}
        error={error}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
};
