import { Carrier, carriers } from "@/db/enum";
import { CARRIER_LABELS } from "@/db/label";
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

/** "2 × 40 ft" from the count and size columns. */
export const containerSummary = (
  shipment: Pick<SelectShipments, "containerCount" | "containerSize">,
): string => {
  if (!shipment.containerCount) {
    return "";
  }
  return shipment.containerSize
    ? `${shipment.containerCount} × ${shipment.containerSize} ft`
    : `${shipment.containerCount} containers`;
};

const WEIGHT_FORMAT = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export const formatWeight = (value: string | null): string =>
  value ? `${WEIGHT_FORMAT.format(Number(value))} kg` : "";

const PRICE_FORMAT = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "12,500 USD", or a dash when no price was entered. */
export const formatPrice = (
  shipment: Pick<SelectShipments, "price" | "priceCurrency">,
): string =>
  shipment.price
    ? `${PRICE_FORMAT.format(Number(shipment.price))} ${shipment.priceCurrency}`
    : "—";
