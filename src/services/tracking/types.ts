/**
 * What every carrier source boils down to. The parsers (Yang Ming, MSC) each
 * produce one of these; everything after that — storing, deriving the status,
 * showing the timeline — only knows this shape.
 */

export type SnapshotEvent = {
  /** Null for a whole-shipment event. */
  containerNumber: string | null;
  occurredAt: Date;
  isEstimated: boolean;
  description: string;
  location: string;
  locationCode: string | null;
  vesselName: string | null;
  voyage: string | null;
  /** The carrier's own order, higher = later. */
  sequence: number;
};

export type SnapshotContainer = {
  containerNumber: string;
  containerType: string | null;
  isDelivered: boolean;
  latestLocation: string | null;
  podEta: Date | null;
};

export type CarrierSnapshot = {
  /** The number the carrier answered for, as the carrier writes it. */
  trackingNumber: string;
  /** Other numbers the same answer covers (MSC returns the B/L for a booking). */
  alternateNumbers: string[];
  portOfLoading: string | null;
  portOfDischarge: string | null;
  /** The carrier's final destination when it differs from the discharge port. */
  placeOfDelivery: string | null;
  vesselName: string | null;
  voyage: string | null;
  etd: Date | null;
  eta: Date | null;
  /** Set when the carrier states delivery outright. */
  isDelivered: boolean;
  containers: SnapshotContainer[];
  events: SnapshotEvent[];
};
