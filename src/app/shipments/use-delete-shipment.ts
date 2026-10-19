"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteShipmentAction } from "./actions";

/**
 * Delete one shipment after the person confirms. `afterDelete` is where to go
 * next; without it the current page stays and its data refreshes.
 */
export const useDeleteShipment = (uuid: string, afterDelete?: string) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const onDelete = () => {
    if (!window.confirm("Delete this shipment, its tracking history and its documents?")) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await deleteShipmentAction(uuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (afterDelete) {
        router.push(afterDelete);
      } else {
        router.refresh();
      }
    });
  };

  return { onDelete, isPending, error };
};
