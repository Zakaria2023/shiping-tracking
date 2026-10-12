// Every enum in the app lives here, as a const array; the schema files import
// the arrays and the union types are derived from them.

/** The shipping line a shipment travels with — the "Company" column of the sheet. */
export const carriers = [
  "yang_ming",
  "msc",
  "bulk_carrier",
  "other",
] as const satisfies readonly string[];

export type Carrier = (typeof carriers)[number];

/** Container shipments are tracked by a number; bulk ones by the vessel. */
export const shipmentKinds = [
  "container",
  "bulk",
] as const satisfies readonly string[];

export type ShipmentKind = (typeof shipmentKinds)[number];

export const shipmentStatuses = [
  "pending",
  "sailing",
  "arrived",
  "delivered",
] as const satisfies readonly string[];

export type ShipmentStatus = (typeof shipmentStatuses)[number];

/** What the tracking number on a shipment is. MSC's page asks; Yang Ming works it out. */
export const trackingNumberTypes = [
  "bill_of_lading",
  "booking",
  "container",
] as const satisfies readonly string[];

export type TrackingNumberType = (typeof trackingNumberTypes)[number];

export const containerSizes = [
  "20",
  "40",
  "45",
] as const satisfies readonly string[];

export type ContainerSize = (typeof containerSizes)[number];

/** Where the last tracking update came from. */
export const trackingSources = [
  "manual",
  "yang_ming",
  "msc_extension",
  "msc_paste",
] as const satisfies readonly string[];

export type TrackingSource = (typeof trackingSources)[number];
