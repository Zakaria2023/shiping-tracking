"use client";

import { RefreshCw } from "lucide-react";
import { startTransition, useActionState } from "react";
import { refreshAllYangMingAction } from "@/app/shipments/actions";
import { Button } from "@/components/ui/button";

/** Pull every open Yang Ming shipment. MSC comes in through the extension. */
export const RefreshAllButton = () => {
  const [state, dispatch, isPending] = useActionState(() => refreshAllYangMingAction(), {});

  return (
    <div className="flex items-center gap-3">
      {state.message && <span className="text-sm text-muted">{state.message}</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() => startTransition(() => dispatch())}
        title="Pull every open Yang Ming shipment from the carrier"
      >
        <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Refreshing…" : "Refresh Yang Ming"}
      </Button>
    </div>
  );
};
