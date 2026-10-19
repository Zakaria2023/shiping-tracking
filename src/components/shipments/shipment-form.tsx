"use client";

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
  carriers,
  containerSizes,
  currencies,
  shipmentKinds,
  shipmentStatuses,
  trackingNumberTypes,
} from "@/db/enum";
import {
  CARRIER_LABELS,
  CONTAINER_SIZE_LABELS,
  SHIPMENT_KIND_LABELS,
  SHIPMENT_STATUS_LABELS,
  TRACKING_NUMBER_TYPE_LABELS,
} from "@/db/label";
import { SelectShipmentDocuments } from "@/db/schema/shipment-documents";
import { SelectShipments } from "@/db/schema/shipments";
import { COUNTRY_OPTIONS } from "@/utils";

type ShipmentFormProps =
  | { mode: "add" }
  | { mode: "edit"; shipment: SelectShipments; documents: SelectShipmentDocuments[] };

const KIND_OPTIONS = shipmentKinds.map((kind) => ({ value: kind, label: SHIPMENT_KIND_LABELS[kind] }));
const CARRIER_OPTIONS = carriers.map((carrier) => ({ value: carrier, label: CARRIER_LABELS[carrier] }));
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
  const { form, error, isPending, onSubmit, kind, carrier, documents } = useShipmentForm(
    props.mode === "edit"
      ? { mode: "edit", shipment: props.shipment, documents: props.documents }
      : { mode: "add" },
  );
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const isBulk = kind === "bulk";
  const tracked = carrier === "yang_ming" || carrier === "msc";

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
                  tracked
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
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          <Field label="Gross weight (kg)" error={errors.grossWeightKg?.message}>
            <Input {...register("grossWeightKg")} inputMode="decimal" placeholder="26854" className="tabular" />
          </Field>
          {!isBulk && (
            <>
              <Field label="Containers" error={errors.containerCount?.message}>
                <Input {...register("containerCount")} inputMode="numeric" placeholder="2" className="tabular" />
              </Field>
              <Field label="Size" error={errors.containerSize?.message}>
                <Controller
                  control={control}
                  name="containerSize"
                  render={({ field }) => (
                    <Dropdown value={field.value ?? ""} onChange={field.onChange} options={SIZE_OPTIONS} />
                  )}
                />
              </Field>
            </>
          )}
          <Field label="Price" error={errors.price?.message}>
            <Input {...register("price")} inputMode="decimal" placeholder="12500" className="tabular" />
          </Field>
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

      <Card
        title="Status"
        description={
          tracked && !isBulk
            ? "A starting point. Once tracking runs, the line's own events set it."
            : "Set manually, since nothing tracks this one automatically."
        }
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Status" error={errors.status?.message}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Dropdown value={field.value} onChange={field.onChange} options={STATUS_OPTIONS} />
              )}
            />
          </Field>
          <Field label="Current location" error={errors.currentLocation?.message} hint="Where the goods are now, e.g. Suez Canal.">
            <Input {...register("currentLocation")} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Notes" error={errors.notes?.message}>
            <Textarea {...register("notes")} rows={3} />
          </Field>
        </div>
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
