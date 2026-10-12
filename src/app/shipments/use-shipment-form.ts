"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SelectShipments } from "@/db/schema/shipments";
import { EMPTY_SHIPMENT_FORM, toShipmentFormValues } from "@/lib/shipment-form-values";
import { ActionResult } from "@/utils";
import { shipmentFormSchema, ShipmentFormValues } from "@/validators/shipment";
import { createShipmentAction, updateShipmentAction } from "./actions";

type UseShipmentFormArgs =
  | { mode: "add" }
  | { mode: "edit"; shipment: SelectShipments };

export const useShipmentForm = (args: UseShipmentFormArgs) => {
  const action =
    args.mode === "edit"
      ? (prevState: ActionResult, values: ShipmentFormValues) =>
          updateShipmentAction(args.shipment.uuid, prevState, values)
      : createShipmentAction;

  const [state, dispatch, isPending] = useActionState(action, {});

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues:
      args.mode === "edit" ? toShipmentFormValues(args.shipment) : EMPTY_SHIPMENT_FORM,
  });

  // The form shows different fields for a bulk ship and for an "other" line.
  const kind = useWatch({ control: form.control, name: "kind" });
  const carrier = useWatch({ control: form.control, name: "carrier" });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit, kind, carrier };
};
