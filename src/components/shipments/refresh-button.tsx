"use client";

import { RefreshCw } from "lucide-react";
import { startTransition, useActionState } from "react";
import { refreshShipmentAction } from "@/app/shipments/actions";
import { Button } from "@/components/ui/button";

type RefreshButtonProps = {
  uuid: string;
};

/** One button, one call: pull this shipment from its line now. */
export const RefreshButton = ({ uuid }: RefreshButtonProps) => {
  const [state, dispatch, isPending] = useActionState(() => refreshShipmentAction(uuid), {});

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() => startTransition(() => dispatch())}
      >
        <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Refreshing…" : "Refresh"}
      </Button>
      {state.message && <span className="text-sm text-muted">{state.message}</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </div>
  );
};
