"use client";

import { Trash2 } from "lucide-react";
import { startTransition, useActionState } from "react";
import { deleteShipmentAction } from "@/app/shipments/actions";
import { Button } from "@/components/ui/button";

type DeleteShipmentButtonProps = {
  uuid: string;
};

export const DeleteShipmentButton = ({ uuid }: DeleteShipmentButtonProps) => {
  const [state, dispatch, isPending] = useActionState(() => deleteShipmentAction(uuid), {});

  return (
    <div className="flex items-center gap-3">
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
      <Button
        variant="danger"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Delete this shipment and its tracking history?")) {
            startTransition(() => dispatch());
          }
        }}
      >
        <Trash2 size={16} />
        {isPending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
};
