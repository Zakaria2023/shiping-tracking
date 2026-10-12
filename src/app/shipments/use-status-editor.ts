"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { SelectShipments } from "@/db/schema/shipments";
import { statusUpdateSchema, StatusUpdateValues } from "@/validators/shipment";
import { MessageResult, setStatusAction, unlockStatusAction } from "./actions";

export const useStatusEditor = (shipment: SelectShipments) => {
  const [state, dispatch, isPending] = useActionState(
    (prevState: MessageResult, values: StatusUpdateValues) =>
      setStatusAction(shipment.uuid, prevState, values),
    {},
  );
  const [unlockState, unlock, isUnlocking] = useActionState(
    () => unlockStatusAction(shipment.uuid),
    {},
  );

  const form = useForm<StatusUpdateValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: shipment.status,
      currentLocation: shipment.currentLocation ?? "",
      // A tracked shipment keeps following the carrier unless asked not to;
      // an untracked one is always by hand, so the lock means nothing there.
      locked: shipment.statusLocked,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const onUnlock = () => {
    startTransition(() => {
      unlock();
    });
  };

  return { form, state, isPending, onSubmit, onUnlock, unlockState, isUnlocking };
};
