import { SelectShipmentCargoLines } from "@/db/schema/shipment-cargo-lines";
import { SelectShipments } from "@/db/schema/shipments";
import { CargoLineFields, ShipmentFields } from "@/services/shipments";
import { parseIsoDate, toIsoDate } from "@/utils";
import { CargoLineFormValues, ShipmentFormValues } from "@/validators/shipment";

export const EMPTY_CARGO_LINE: CargoLineFormValues = {
  grossWeightKg: "",
  containerCount: "",
  containerSize: "",
  price: "",
};

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
  cargoLines: [EMPTY_CARGO_LINE],
  priceCurrency: "USD",
  etd: "",
  eta: "",
  status: "pending",
  currentLocation: "",
  nextLocation: "",
  notes: "",
};

const toCargoLineFormValues = (line: SelectShipmentCargoLines): CargoLineFormValues => ({
  grossWeightKg: line.grossWeightKg ? String(Number(line.grossWeightKg)) : "",
  containerCount: line.containerCount ? String(line.containerCount) : "",
  containerSize: line.containerSize ?? "",
  price: line.price ? String(Number(line.price)) : "",
});

/** A saved row and its cargo lines, as the form fields. */
export const toShipmentFormValues = (
  shipment: SelectShipments,
  cargoLines: SelectShipmentCargoLines[],
): ShipmentFormValues => ({
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
  // The form always shows at least one line to fill in.
  cargoLines: cargoLines.length ? cargoLines.map(toCargoLineFormValues) : [EMPTY_CARGO_LINE],
  priceCurrency: shipment.priceCurrency,
  etd: toIsoDate(shipment.etd),
  eta: toIsoDate(shipment.eta),
  status: shipment.status,
  currentLocation: shipment.currentLocation ?? "",
  nextLocation: shipment.nextLocation ?? "",
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
  priceCurrency: values.priceCurrency,
  etd: parseIsoDate(values.etd),
  eta: parseIsoDate(values.eta),
  status: values.status,
  statusLocked: false,
  currentLocation: blankToNull(values.currentLocation),
  nextLocation: values.kind === "bulk" ? blankToNull(values.nextLocation) : null,
  notes: blankToNull(values.notes),
});

/** The filled-in cargo lines; a bulk ship carries no containers. */
export const toCargoLineFields = (values: ShipmentFormValues): CargoLineFields[] =>
  values.cargoLines
    .map((line) => {
      const isBulk = values.kind === "bulk";
      return {
        grossWeightKg: blankToNull(line.grossWeightKg),
        containerCount: !isBulk && line.containerCount ? Number(line.containerCount) : null,
        containerSize: !isBulk && line.containerSize ? line.containerSize : null,
        price: blankToNull(line.price),
      };
    })
    .filter(
      (line) =>
        line.grossWeightKg !== null ||
        line.containerCount !== null ||
        line.containerSize !== null ||
        line.price !== null,
    );
