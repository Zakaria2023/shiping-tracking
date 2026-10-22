import { Carrier, carriers, Currency } from "@/db/enum";
import { CARRIER_LABELS } from "@/db/label";
import { SelectShipmentCargoLines } from "@/db/schema/shipment-cargo-lines";
import { SelectShipments } from "@/db/schema/shipments";

/** Browser-safe helpers for naming a shipment on screen. */

export const shipmentTitle = (
  shipment: Pick<SelectShipments, "trackingNumber" | "vesselName">,
): string => shipment.trackingNumber || shipment.vesselName || "Shipment";

export const carrierLabel = (
  shipment: Pick<SelectShipments, "carrier" | "carrierName">,
): string =>
  shipment.carrier === "other" && shipment.carrierName
    ? shipment.carrierName
    : CARRIER_LABELS[shipment.carrier];

// Not lines in their own right, so they follow the named lines.
const CATCH_ALL_CARRIERS: readonly Carrier[] = ["bulk_carrier", "other", "not_yet"];

/** Every line for a picker: the named lines A to Z, then bulk, other and "not yet". */
export const CARRIER_OPTIONS: { value: Carrier; label: string }[] = [
  ...carriers
    .filter((carrier) => !CATCH_ALL_CARRIERS.includes(carrier))
    .sort((a, b) => CARRIER_LABELS[a].localeCompare(CARRIER_LABELS[b], "en-GB")),
  ...CATCH_ALL_CARRIERS,
].map((carrier) => ({ value: carrier, label: CARRIER_LABELS[carrier] }));

type CargoLine = Pick<
  SelectShipmentCargoLines,
  "grossWeightKg" | "containerCount" | "containerSize" | "price"
>;

/** "2 × 40 ft + 1 × 20 ft" across the lines, adding up lines of the same size. */
export const containerSummary = (lines: CargoLine[]): string => {
  const countBySize = new Map<string, number>();
  for (const line of lines) {
    if (line.containerCount) {
      const size = line.containerSize ?? "";
      countBySize.set(size, (countBySize.get(size) ?? 0) + line.containerCount);
    }
  }
  return [...countBySize]
    .map(([size, total]) => (size ? `${total} × ${size} ft` : `${total} containers`))
    .join(" + ");
};

/** The sum of a decimal column over the lines, or null when no line has it. */
const sumOf = (values: (string | null)[]): number | null => {
  const present = values.filter((value) => value !== null);
  return present.length ? present.reduce((total, value) => total + Number(value), 0) : null;
};

export const totalWeightKg = (lines: CargoLine[]): number | null =>
  sumOf(lines.map((line) => line.grossWeightKg));

export const totalPrice = (lines: CargoLine[]): number | null =>
  sumOf(lines.map((line) => line.price));

const WEIGHT_FORMAT = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export const formatWeight = (value: number | null): string =>
  value !== null ? `${WEIGHT_FORMAT.format(value)} kg` : "";

const PRICE_FORMAT = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "12,500 USD", or a dash when no price was entered. */
export const formatPrice = (value: number | null, currency: Currency): string =>
  value !== null ? `${PRICE_FORMAT.format(value)} ${currency}` : "—";
