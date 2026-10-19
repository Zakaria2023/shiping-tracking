"use client";

import { LockOpen } from "lucide-react";
import { Controller } from "react-hook-form";
import { useStatusEditor } from "@/app/shipments/use-status-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { shipmentStatuses } from "@/db/enum";
import { SHIPMENT_STATUS_LABELS } from "@/db/label";
import { SelectShipments } from "@/db/schema/shipments";

type StatusEditorProps = {
  shipment: SelectShipments;
};

const STATUS_OPTIONS = shipmentStatuses.map((status) => ({
  value: status,
  label: SHIPMENT_STATUS_LABELS[status],
}));

export const StatusEditor = ({ shipment }: StatusEditorProps) => {
  const { form, state, isPending, onSubmit, onUnlock, unlockState, isUnlocking } =
    useStatusEditor(shipment);
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const tracked =
    shipment.kind === "container" &&
    (shipment.carrier === "yang_ming" || shipment.carrier === "msc");

  return (
    <Card
      title="Set manually"
      description={
        tracked
          ? "Override what the line reports. Tick the box to keep it until you unlock it."
          : "Nothing tracks this shipment automatically, so this is where its status lives."
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Status" error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Dropdown value={field.value} onChange={field.onChange} options={STATUS_OPTIONS} />
            )}
          />
        </Field>
        <Field label="Current location" error={errors.currentLocation?.message}>
          <Input {...register("currentLocation")} placeholder="Suez Canal" />
        </Field>
        {tracked && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" {...register("locked")} className="h-4 w-4 accent-primary" />
            Keep this status until I unlock it
          </label>
        )}
        <FormError message={state.error ?? unlockState.error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          {tracked && shipment.statusLocked && (
            <Button variant="ghost" disabled={isUnlocking} onClick={onUnlock}>
              <LockOpen size={15} />
              {isUnlocking ? "Unlocking…" : "Unlock"}
            </Button>
          )}
          {(state.message || unlockState.message) && (
            <span className="text-sm text-muted">{state.message ?? unlockState.message}</span>
          )}
        </div>
      </form>
    </Card>
  );
};
