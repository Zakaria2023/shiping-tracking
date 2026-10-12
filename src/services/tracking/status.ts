import { ShipmentStatus } from "@/db/enum";
import { samePlace } from "@/utils";
import { CarrierSnapshot, SnapshotEvent } from "./types";

/**
 * The one rule that turns a carrier's history into pending / sailing /
 * arrived / delivered. Pure, so it is tested against the saved samples.
 *
 * - delivered: the carrier says so, or every box has been delivered.
 * - arrived: a real (not estimated) arrival, discharge or berthing at the port
 *   of discharge, or at the final destination.
 * - sailing: a real departure or "loaded on vessel".
 * - pending: nothing has left yet.
 */

const ARRIVAL_PATTERN = /arriv|discharg|berth/i;
const DEPARTURE_PATTERN = /departure|departed|loaded on vessel|on board|transshipment loaded/i;
const DELIVERED_PATTERN = /delivered to consignee|empty.*return|gate out|full out/i;

const actualEvents = (snapshot: CarrierSnapshot): SnapshotEvent[] =>
  snapshot.events.filter((event) => !event.isEstimated);

const atDischarge = (snapshot: CarrierSnapshot, event: SnapshotEvent): boolean =>
  samePlace(event.location, snapshot.portOfDischarge) ||
  samePlace(event.location, snapshot.placeOfDelivery);

export const deriveStatus = (snapshot: CarrierSnapshot): ShipmentStatus => {
  const actual = actualEvents(snapshot);

  if (snapshot.isDelivered || actual.some((e) => DELIVERED_PATTERN.test(e.description))) {
    return "delivered";
  }

  const arrived = actual.some(
    (event) =>
      event.description === "Arrival at final destination" ||
      (ARRIVAL_PATTERN.test(event.description) && atDischarge(snapshot, event)),
  );
  if (arrived) {
    return "arrived";
  }

  if (actual.some((event) => DEPARTURE_PATTERN.test(event.description))) {
    return "sailing";
  }

  return "pending";
};

/** The latest real event, which is where the goods are now. */
export const latestActualEvent = (snapshot: CarrierSnapshot): SnapshotEvent | null =>
  actualEvents(snapshot).reduce<SnapshotEvent | null>((latest, event) => {
    if (!latest) {
      return event;
    }
    const byTime = event.occurredAt.getTime() - latest.occurredAt.getTime();
    if (byTime !== 0) {
      return byTime > 0 ? event : latest;
    }
    return event.sequence > latest.sequence ? event : latest;
  }, null);
