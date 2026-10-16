"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SelectShipmentDocuments } from "@/db/schema/shipment-documents";
import { SelectShipments } from "@/db/schema/shipments";
import { EMPTY_SHIPMENT_FORM, toShipmentFormValues } from "@/lib/shipment-form-values";
import { shipmentFormSchema, ShipmentFormValues } from "@/validators/shipment";
import { createShipmentAction, updateShipmentAction } from "./actions";
import { useShipmentDocuments } from "./use-shipment-documents";

type UseShipmentFormArgs =
  | { mode: "add" }
  | { mode: "edit"; shipment: SelectShipments; documents: SelectShipmentDocuments[] };

export const useShipmentForm = (args: UseShipmentFormArgs) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const documents = useShipmentDocuments(args.mode === "edit" ? args.documents : []);

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues:
      args.mode === "edit" ? toShipmentFormValues(args.shipment) : EMPTY_SHIPMENT_FORM,
  });

  // The form shows different fields for a bulk ship and for an "other" line.
  const kind = useWatch({ control: form.control, name: "kind" });
  const carrier = useWatch({ control: form.control, name: "carrier" });

  // Save the shipment first, then its documents, which need its uuid.
  const onSubmit = form.handleSubmit((values) => {
    setError(undefined);
    startTransition(async () => {
      const result =
        args.mode === "edit"
          ? await updateShipmentAction(args.shipment.uuid, values)
          : await createShipmentAction(values);
      if (!result.uuid) {
        setError(result.error ?? "Failed to save the shipment");
        return;
      }
      const documentError = await documents.apply(result.uuid);
      if (!documentError) {
        router.push(`/shipments/${result.uuid}`);
        return;
      }
      if (args.mode === "add") {
        // The shipment exists now; saving this form again would make a second one.
        router.push(`/shipments/${result.uuid}/edit?documents=failed`);
        return;
      }
      setError(`The shipment was saved, but: ${documentError}`);
    });
  });

  return { form, error, isPending, onSubmit, kind, carrier, documents };
};
