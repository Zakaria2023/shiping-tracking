"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteShipmentAction } from "./actions";

/**
 * Delete one shipment once the person confirms in the dialog. `afterDelete`
 * is where to go next; without it the current page stays and its data
 * refreshes.
 */
export const useDeleteShipment = (uuid: string, afterDelete?: string) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const requestDelete = () => {
    setError(undefined);
    setOpen(true);
  };

  const cancel = () => {
    setOpen(false);
  };

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteShipmentAction(uuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (afterDelete) {
        router.push(afterDelete);
      } else {
        router.refresh();
      }
    });
  };

  return { open, isPending, error, requestDelete, cancel, confirm };
};
