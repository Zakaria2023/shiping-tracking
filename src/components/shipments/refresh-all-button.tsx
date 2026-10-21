"use client";

import { RefreshCw } from "lucide-react";
import { startTransition, useActionState } from "react";
import { refreshAllTrackedAction } from "@/app/shipments/actions";
import { Button } from "@/components/ui/button";

/** Pull every open shipment on a line the app reads. MSC comes in through the paste. */
export const RefreshAllButton = () => {
  const [state, dispatch, isPending] = useActionState(() => refreshAllTrackedAction(), {});

  return (
    <div className="flex items-center gap-3">
      {state.message && <span className="text-sm text-muted">{state.message}</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={() => startTransition(() => dispatch())}
        title="Pull every open shipment from its line: Yang Ming, COSCO, ONE, Arkas and First Flight"
      >
        <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Refreshing…" : "Refresh all"}
      </Button>
    </div>
  );
};
