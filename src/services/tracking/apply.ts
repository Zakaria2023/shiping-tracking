import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { TrackingSource } from "@/db/enum";
import { ShipmentContainers } from "@/db/schema/shipment-containers";
import { SelectShipments, Shipments } from "@/db/schema/shipments";
import { TrackingEvents } from "@/db/schema/tracking-events";
import { generateUuid, portNameOnly } from "@/utils";
import { deriveStatus, latestActualEvent } from "./status";
import { CarrierSnapshot, SnapshotEvent } from "./types";

export type ApplyOutcome = {
  status: SelectShipments["status"];
  statusChanged: boolean;
  newEvents: number;
};

const fingerprintOf = (event: SnapshotEvent): string =>
  createHash("sha1")
    .update(
      [
        event.containerNumber ?? "",
        event.description,
        event.occurredAt.toISOString(),
        // Not the place text: the same event re-read after a change in how a
        // place name is trimmed must still be the same row.
        event.isEstimated ? "est" : "act",
      ].join("|"),
    )
    .digest("hex");

/**
 * Store what a carrier said about one shipment: its boxes, every event, and
 * the facts on the row itself. The status follows the events unless somebody
 * locked it by hand.
 */
export const applySnapshot = async (
  shipmentUuid: string,
  snapshot: CarrierSnapshot,
  source: TrackingSource,
): Promise<ApplyOutcome> => {
  const [shipment] = await db
    .select({
      status: Shipments.status,
      statusLocked: Shipments.statusLocked,
    })
    .from(Shipments)
    .where(eq(Shipments.uuid, shipmentUuid));
  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const derived = deriveStatus(snapshot);
  const nextStatus = shipment.statusLocked ? shipment.status : derived;
  const latest = latestActualEvent(snapshot);
  let newEvents = 0;

  await db.transaction(async (tx) => {
    for (const box of snapshot.containers) {
      await tx
        .insert(ShipmentContainers)
        .values({
          uuid: generateUuid(),
          shipmentUuid,
          containerNumber: box.containerNumber,
          containerType: box.containerType,
          isDelivered: box.isDelivered,
          latestLocation: box.latestLocation,
          podEta: box.podEta,
        })
        .onDuplicateKeyUpdate({
          set: {
            containerType: box.containerType,
            isDelivered: box.isDelivered,
            latestLocation: box.latestLocation,
            podEta: box.podEta,
          },
        });
    }

    for (const event of snapshot.events) {
      const fingerprint = fingerprintOf(event);
      const result = await tx
        .insert(TrackingEvents)
        .values({
          uuid: generateUuid(),
          shipmentUuid,
          containerNumber: event.containerNumber,
          occurredAt: event.occurredAt,
          isEstimated: event.isEstimated,
          description: event.description,
          location: event.location,
          locationCode: event.locationCode,
          vesselName: event.vesselName,
          voyage: event.voyage,
          sequence: event.sequence,
          fingerprint,
        })
        // A repeat is a no-op; MySQL reports 1 affected row for a fresh insert
        // and 0 for an unchanged duplicate.
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
      if (result[0].affectedRows === 1) {
        newEvents += 1;
      }
    }

    await tx
      .update(Shipments)
      .set({
        status: nextStatus,
        vesselName: snapshot.vesselName ?? undefined,
        voyage: snapshot.voyage ?? undefined,
        etd: snapshot.etd ?? undefined,
        eta: snapshot.eta ?? undefined,
        currentLocation: latest ? portNameOnly(latest.location) : undefined,
        lastEventAt: latest?.occurredAt ?? undefined,
        lastEventDescription: latest?.description ?? undefined,
        lastTrackedAt: new Date(),
        lastTrackedSource: source,
        trackingError: null,
      })
      .where(eq(Shipments.uuid, shipmentUuid));
  });

  return {
    status: nextStatus,
    statusChanged: nextStatus !== shipment.status,
    newEvents,
  };
};

/** Remember why a refresh failed, so the row can say so. */
export const recordTrackingError = async (
  shipmentUuid: string,
  message: string,
): Promise<void> => {
  await db
    .update(Shipments)
    .set({ trackingError: message, lastTrackedAt: new Date() })
    .where(eq(Shipments.uuid, shipmentUuid));
};
