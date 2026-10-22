"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { useShipmentForm } from "@/app/shipments/use-shipment-form";
import { DocumentsField } from "@/components/shipments/documents-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Dropdown } from "@/components/ui/dropdown";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  containerSizes,
  currencies,
  shipmentKinds,
  shipmentStatuses,
  trackingNumberTypes,
} from "@/db/enum";
import {
  CONTAINER_SIZE_LABELS,
  SHIPMENT_KIND_LABELS,
  SHIPMENT_STATUS_LABELS,
  TRACKING_NUMBER_TYPE_LABELS,
} from "@/db/label";
import { SelectShipmentCargoLines } from "@/db/schema/shipment-cargo-lines";
import { SelectShipmentDocuments } from "@/db/schema/shipment-documents";
import { SelectShipments } from "@/db/schema/shipments";
import { isAutoTrackedCarrier, isCarrierTracked } from "@/lib/carrier-tracking";
import { CARRIER_OPTIONS } from "@/lib/shipment-display";
import { COUNTRY_OPTIONS } from "@/utils";

type ShipmentFormProps =
  | { mode: "add" }
  | {
      mode: "edit";
      shipment: SelectShipments;
      cargoLines: SelectShipmentCargoLines[];
      documents: SelectShipmentDocuments[];
    };

const KIND_OPTIONS = shipmentKinds.map((kind) => ({ value: kind, label: SHIPMENT_KIND_LABELS[kind] }));
const NUMBER_TYPE_OPTIONS = trackingNumberTypes.map((type) => ({
  value: type,
  label: TRACKING_NUMBER_TYPE_LABELS[type],
}));
const SIZE_OPTIONS = [
  { value: "", label: "Not set" },
  ...containerSizes.map((size) => ({ value: size, label: CONTAINER_SIZE_LABELS[size] })),
];
const CURRENCY_OPTIONS = currencies.map((currency) => ({ value: currency, label: currency }));
const STATUS_OPTIONS = shipmentStatuses.map((status) => ({
  value: status,
  label: SHIPMENT_STATUS_LABELS[status],
}));

export const ShipmentForm = (props: ShipmentFormProps) => {
  const {
    form,
    error,
    isPending,
    onSubmit,
    kind,
    carrier,
    documents,
    cargoLines,
    addCargoLine,
    removeCargoLine,
  } = useShipmentForm(
    props.mode === "edit"
      ? {
          mode: "edit",
          shipment: props.shipment,
          cargoLines: props.cargoLines,
          documents: props.documents,
        }
      : { mode: "add" },
  );
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const isBulk = kind === "bulk";
  const tracked = isCarrierTracked(carrier);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card title="Shipment" description="Who it is for, what it is and who carries it.">
        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Customer" error={errors.customerName?.message}>
            <Input {...register("customerName")} invalid={Boolean(errors.customerName)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Type" error={errors.kind?.message}>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Dropdown value={field.value} onChange={field.onChange} options={KIND_OPTIONS} />
              )}
            />
          </Field>
          <Field label="Shipping line" error={errors.carrier?.message}>
            <Controller
              control={control}
              name="carrier"
              render={({ field }) => (
                <Dropdown value={field.value} onChange={field.onChange} options={CARRIER_OPTIONS} />
              )}
            />
          </Field>
          {carrier === "other" && (
            <Field label="Line name" error={errors.carrierName?.message}>
              <Input {...register("carrierName")} invalid={Boolean(errors.carrierName)} />
            </Field>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {!isBulk && (
            <>
              <Field
                label="Tracking number"
                error={errors.trackingNumber?.message}
                hint={
                  isAutoTrackedCarrier(carrier)
                    ? "As printed by the line. Its tracking is pulled as soon as you save."
                    : tracked
                      ? "As printed by the line. This is what tracking searches for."
                      : carrier === "not_yet"
                        ? "Optional until the line is booked."
                        : undefined
                }
              >
                <Input
                  {...register("trackingNumber")}
                  invalid={Boolean(errors.trackingNumber)}
                  className="font-mono uppercase"
                  placeholder="MEDUWL539899"
                />
              </Field>
              <Field label="Number type" error={errors.trackingNumberType?.message}>
                <Controller
                  control={control}
                  name="trackingNumberType"
                  render={({ field }) => (
                    <Dropdown
                      value={field.value}
                      onChange={field.onChange}
                      options={NUMBER_TYPE_OPTIONS}
                    />
                  )}
                />
              </Field>
            </>
          )}
          <Field
            label="Vessel"
            error={errors.vesselName?.message}
            hint={!isBulk && tracked ? "Filled in by tracking; leave blank." : undefined}
          >
            <Input {...register("vesselName")} invalid={Boolean(errors.vesselName)} placeholder="M/V LUCKY GLORY" />
          </Field>
          {isBulk && (
            <Field label="Voyage" error={errors.voyage?.message}>
              <Input {...register("voyage")} />
            </Field>
          )}
        </div>
      </Card>

      <Card title="Route" description="Where it loads and where it discharges. The country is what the filters use.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Port of loading" error={errors.portOfLoading?.message}>
            <Input {...register("portOfLoading")} invalid={Boolean(errors.portOfLoading)} placeholder="Shanghai" />
          </Field>
          <Field label="Loading country" error={errors.loadingCountry?.message}>
            <Controller
              control={control}
              name="loadingCountry"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={COUNTRY_OPTIONS}
                  placeholder="Choose a country"
                  invalid={Boolean(errors.loadingCountry)}
                />
              )}
            />
          </Field>
          <Field label="Port of discharge" error={errors.portOfDischarge?.message}>
            <Input {...register("portOfDischarge")} invalid={Boolean(errors.portOfDischarge)} placeholder="Iskenderun" />
          </Field>
          <Field label="Discharge country" error={errors.dischargeCountry?.message}>
            <Controller
              control={control}
              name="dischargeCountry"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={COUNTRY_OPTIONS}
                  placeholder="Choose a country"
                  invalid={Boolean(errors.dischargeCountry)}
                />
              )}
            />
          </Field>
        </div>
      </Card>

      <Card title="Cargo and dates" description="From the booking. Tracking updates the dates when the line does.">
        <ul className="flex flex-col gap-4">
          {cargoLines.map((line, index) => {
            const lineErrors = errors.cargoLines?.[index];
            return (
              <li
                key={line.id}
                className={`grid grid-cols-[1fr_1fr_auto] gap-x-5 gap-y-4 ${
                  isBulk ? "md:grid-cols-[1fr_1fr_auto]" : "md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                }`}
              >
                <Field label="Gross weight (kg)" error={lineErrors?.grossWeightKg?.message}>
                  <Input
                    {...register(`cargoLines.${index}.grossWeightKg`)}
                    inputMode="decimal"
                    placeholder="26854"
                    className="tabular"
                  />
                </Field>
                {!isBulk && (
                  <>
                    <Field label="Containers" error={lineErrors?.containerCount?.message}>
                      <Input
                        {...register(`cargoLines.${index}.containerCount`)}
                        inputMode="numeric"
                        placeholder="2"
                        className="tabular"
                      />
                    </Field>
                    <Field label="Size" error={lineErrors?.containerSize?.message}>
                      <Controller
                        control={control}
                        name={`cargoLines.${index}.containerSize`}
                        render={({ field }) => (
                          <Dropdown value={field.value ?? ""} onChange={field.onChange} options={SIZE_OPTIONS} />
                        )}
                      />
                    </Field>
                  </>
                )}
                <Field label="Price" error={lineErrors?.price?.message}>
                  <Input
                    {...register(`cargoLines.${index}.price`)}
                    inputMode="decimal"
                    placeholder="12500"
                    className="tabular"
                  />
                </Field>
                <div className="col-start-3 row-start-1 flex items-end pb-2 md:col-start-auto">
                  <button
                    type="button"
                    onClick={() => removeCargoLine(index)}
                    disabled={cargoLines.length === 1}
                    aria-label={`Remove line ${index + 1}`}
                    title="Remove line"
                    className="rounded-control p-1.5 text-faint hover:bg-hover hover:text-ink disabled:invisible"
                  >
                    <X size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <Button variant="secondary" onClick={addCargoLine} className="mt-4">
          <Plus size={15} />
          Add line
        </Button>

        <div className="mt-5 grid grid-cols-2 gap-5 border-t border-hairline-soft pt-5 md:grid-cols-4">
          <Field label="Currency" error={errors.priceCurrency?.message}>
            <Controller
              control={control}
              name="priceCurrency"
              render={({ field }) => (
                <Dropdown value={field.value} onChange={field.onChange} options={CURRENCY_OPTIONS} />
              )}
            />
          </Field>
          <Field label="ETD" error={errors.etd?.message}>
            <Controller
              control={control}
              name="etd"
              render={({ field }) => (
                <DateInput
                  name={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={Boolean(errors.etd)}
                />
              )}
            />
          </Field>
          <Field label="ETA" error={errors.eta?.message}>
            <Controller
              control={control}
              name="eta"
              render={({ field }) => (
                <DateInput
                  name={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={Boolean(errors.eta)}
                />
              )}
            />
          </Field>
        </div>
      </Card>

      {/* A container shipment's status and whereabouts come from its line. */}
      <Card
        title={isBulk ? "Status" : "Notes"}
        description={isBulk ? "Set manually, since nothing tracks a bulk ship automatically." : undefined}
      >
        {isBulk && (
          <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Dropdown value={field.value} onChange={field.onChange} options={STATUS_OPTIONS} />
                )}
              />
            </Field>
            <Field label="Current location" error={errors.currentLocation?.message} hint="Where the ship is now, e.g. Suez Canal.">
              <Input {...register("currentLocation")} />
            </Field>
            <Field label="Next location" error={errors.nextLocation?.message} hint="Where it calls next, e.g. Port Said.">
              <Input {...register("nextLocation")} />
            </Field>
          </div>
        )}
        <Field label="Notes" error={errors.notes?.message}>
          <Textarea {...register("notes")} rows={3} />
        </Field>
      </Card>

      <DocumentsField documents={documents} />

      <FormError message={error} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {props.mode === "edit"
            ? isPending
              ? "Saving…"
              : "Save changes"
            : isPending
              ? "Creating…"
              : "Create shipment"}
        </Button>
        <Link
          href={props.mode === "edit" ? `/shipments/${props.shipment.uuid}` : "/shipments"}
          className="text-sm text-muted hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};
