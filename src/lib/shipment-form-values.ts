import { SelectShipments } from "@/db/schema/shipments";
import { ShipmentFields } from "@/services/shipments";
import { parseIsoDate, toIsoDate } from "@/utils";
import { ShipmentFormValues } from "@/validators/shipment";

/** What the form starts with for a new shipment. */
export const EMPTY_SHIPMENT_FORM: ShipmentFormValues = {
  customerName: "",
  kind: "container",
  carrier: "yang_ming",
  carrierName: "",
  trackingNumber: "",
  trackingNumberType: "bill_of_lading",
  vesselName: "",
  voyage: "",
  portOfLoading: "",
  loadingCountry: "",
  portOfDischarge: "",
  dischargeCountry: "",
  grossWeightKg: "",
  containerCount: "",
  containerSize: "",
  price: "",
  priceCurrency: "USD",
  etd: "",
  eta: "",
  status: "pending",
  currentLocation: "",
  notes: "",
};

/** A saved row, as the form fields. */
export const toShipmentFormValues = (shipment: SelectShipments): ShipmentFormValues => ({
  customerName: shipment.customerName ?? "",
  kind: shipment.kind,
  carrier: shipment.carrier,
  carrierName: shipment.carrierName ?? "",
  trackingNumber: shipment.trackingNumber ?? "",
  trackingNumberType: shipment.trackingNumberType,
  vesselName: shipment.vesselName ?? "",
  voyage: shipment.voyage ?? "",
  portOfLoading: shipment.portOfLoading,
  loadingCountry: shipment.loadingCountry,
  portOfDischarge: shipment.portOfDischarge,
  dischargeCountry: shipment.dischargeCountry,
  grossWeightKg: shipment.grossWeightKg ? String(Number(shipment.grossWeightKg)) : "",
  containerCount: shipment.containerCount ? String(shipment.containerCount) : "",
  containerSize: shipment.containerSize ?? "",
  price: shipment.price ? String(Number(shipment.price)) : "",
  priceCurrency: shipment.priceCurrency,
  etd: toIsoDate(shipment.etd),
  eta: toIsoDate(shipment.eta),
  status: shipment.status,
  currentLocation: shipment.currentLocation ?? "",
  notes: shipment.notes ?? "",
});

const blankToNull = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
};

/** Validated form values, as the columns the service writes. */
export const toShipmentFields = (values: ShipmentFormValues): ShipmentFields => ({
  customerName: blankToNull(values.customerName),
  kind: values.kind,
  carrier: values.carrier,
  carrierName: values.carrier === "other" ? blankToNull(values.carrierName) : null,
  trackingNumber: values.kind === "container" ? blankToNull(values.trackingNumber)?.toUpperCase() ?? null : null,
  trackingNumberType: values.trackingNumberType,
  vesselName: blankToNull(values.vesselName),
  voyage: blankToNull(values.voyage),
  portOfLoading: values.portOfLoading.trim(),
  loadingCountry: values.loadingCountry.toUpperCase(),
  portOfDischarge: values.portOfDischarge.trim(),
  dischargeCountry: values.dischargeCountry.toUpperCase(),
  grossWeightKg: blankToNull(values.grossWeightKg),
  containerCount: values.containerCount ? Number(values.containerCount) : null,
  containerSize: values.containerSize ? values.containerSize : null,
  price: blankToNull(values.price),
  priceCurrency: values.priceCurrency,
  etd: parseIsoDate(values.etd),
  eta: parseIsoDate(values.eta),
  status: values.status,
  statusLocked: false,
  currentLocation: blankToNull(values.currentLocation),
  notes: blankToNull(values.notes),
});
