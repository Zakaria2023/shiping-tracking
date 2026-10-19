import {
  Carrier,
  ContainerSize,
  ShipmentKind,
  ShipmentStatus,
  TrackingNumberType,
  TrackingSource,
} from "./enum";

export const CARRIER_LABELS: Record<Carrier, string> = {
  yang_ming: "Yang Ming",
  msc: "MSC",
  bulk_carrier: "Bulk Carrier",
  other: "Other",
  not_yet: "Not yet",
};

export const SHIPMENT_KIND_LABELS: Record<ShipmentKind, string> = {
  container: "Container",
  bulk: "Bulk",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  sailing: "Sailing",
  arrived: "Arrived",
  delivered: "Delivered",
};

export const TRACKING_NUMBER_TYPE_LABELS: Record<TrackingNumberType, string> = {
  bill_of_lading: "Bill of lading",
  booking: "Booking number",
  container: "Container number",
};

export const CONTAINER_SIZE_LABELS: Record<ContainerSize, string> = {
  "20": "20 ft",
  "40": "40 ft",
  "45": "45 ft",
};

export const TRACKING_SOURCE_LABELS: Record<TrackingSource, string> = {
  manual: "Entered manually",
  yang_ming: "Yang Ming",
  msc_extension: "MSC (browser extension)",
  msc_paste: "MSC (pasted)",
};
