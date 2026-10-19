"use client";

import { Trash2 } from "lucide-react";
import { useDeleteShipment } from "@/app/shipments/use-delete-shipment";
import { Button } from "@/components/ui/button";

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
  label = "shipment",
}: DeleteShipmentButtonProps) => {
  const { onDelete, isPending, error } = useDeleteShipment(uuid, afterDelete);

  if (variant === "icon") {
    return (
      <span className="relative z-10 inline-flex flex-col items-end">
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          aria-label={`Delete ${label}`}
          title={error ?? "Delete"}
          className="inline-flex rounded-control p-1.5 text-muted hover:bg-danger-tint hover:text-danger disabled:opacity-60"
        >
          <Trash2 size={15} />
        </button>
        {error && <span className="text-xs text-danger">Not deleted</span>}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-danger">{error}</span>}
      <Button variant="danger" disabled={isPending} onClick={onDelete}>
        <Trash2 size={16} />
        {isPending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
};
