import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { Carrier } from "@/db/enum";
import { CARRIER_LABELS } from "@/db/label";
import { Shipments } from "@/db/schema/shipments";
import { AutoTrackedCarrier, autoTrackedCarriers, isAutoTrackedCarrier } from "@/lib/carrier-tracking";
import { ApplyOutcome, applySnapshot, recordTrackingError } from "./apply";
import { parseMscTrackingInfo } from "./msc";
import { TRACKERS } from "./trackers";

export type RefreshSummary = {
  refreshed: number;
  failed: number;
  statusChanges: number;
};

export type RefreshOutcome = ApplyOutcome & { carrier: AutoTrackedCarrier };

export type MscIngestOutcome = {
  trackingNumber: string;
  shipmentUuid: string | null;
  outcome: ApplyOutcome | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pull one shipment from its line and store it. */
export const refreshCarrierShipment = async (uuid: string): Promise<RefreshOutcome> => {
  const [shipment] = await db
    .select({ trackingNumber: Shipments.trackingNumber, carrier: Shipments.carrier })
    .from(Shipments)
    .where(eq(Shipments.uuid, uuid));
  if (!shipment) {
    throw new Error("Shipment not found");
  }
  const { carrier, trackingNumber } = shipment;
  if (!isAutoTrackedCarrier(carrier) || !trackingNumber) {
    throw new Error(
      trackingNumber
        ? `The app cannot read ${CARRIER_LABELS[carrier]} itself`
        : "Add the tracking number first",
    );
  }
  try {
    const snapshot = await TRACKERS[carrier](trackingNumber);
    return { ...(await applySnapshot(uuid, snapshot, carrier)), carrier };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed";
    await recordTrackingError(uuid, message);
    throw error;
  }
};

/** Whether the app can pull this shipment from the carrier itself. */
export const isAutoTracked = (shipment: { carrier: Carrier; trackingNumber?: string | null }): boolean =>
  isAutoTrackedCarrier(shipment.carrier) && Boolean(shipment.trackingNumber);

/**
 * Pull a shipment straight after it is saved, so its page opens on the
 * carrier's data. A failure is already stored on the shipment as its
 * tracking error, and the save itself stands, so nothing is thrown.
 */
export const trackAfterSave = async (uuid: string): Promise<void> => {
  try {
    await refreshCarrierShipment(uuid);
  } catch (error) {
    console.error("Tracking right after saving failed", error);
  }
};

/**
 * Every open shipment on a line the app reads, one at a time with a pause
 * between calls so no carrier sees a burst from this address.
 */
export const refreshAllTracked = async (): Promise<RefreshSummary> => {
  const rows = await db
    .select({ uuid: Shipments.uuid })
    .from(Shipments)
    .where(
      and(
        inArray(Shipments.carrier, [...autoTrackedCarriers]),
        isNotNull(Shipments.trackingNumber),
        ne(Shipments.status, "delivered"),
      ),
    )
    .orderBy(Shipments.id);

  const summary: RefreshSummary = { refreshed: 0, failed: 0, statusChanges: 0 };
  for (const [index, row] of rows.entries()) {
    if (index > 0) {
      await sleep(2_000);
    }
    try {
      const outcome = await refreshCarrierShipment(row.uuid);
      summary.refreshed += 1;
      if (outcome.statusChanged) {
        summary.statusChanges += 1;
      }
    } catch {
      summary.failed += 1;
    }
  }
  return summary;
};

/**
 * Take an MSC `TrackingInfo` answer (from the extension or a paste) and store
 * it against whichever shipments carry one of its numbers. A booking search
 * can answer for several bills of lading; each is matched on its own.
 */
export const ingestMscTrackingInfo = async (
  payload: unknown,
  source: "msc_extension" | "msc_paste",
): Promise<MscIngestOutcome[]> => {
  const snapshots = parseMscTrackingInfo(payload);
  const outcomes: MscIngestOutcome[] = [];

  for (const snapshot of snapshots) {
    const numbers = [snapshot.trackingNumber, ...snapshot.alternateNumbers].map((n) =>
      n.trim().toUpperCase(),
    );
    const matches = await db
      .select({ uuid: Shipments.uuid })
      .from(Shipments)
      .where(and(eq(Shipments.carrier, "msc"), inArray(Shipments.trackingNumber, numbers)));

    if (matches.length === 0) {
      outcomes.push({ trackingNumber: snapshot.trackingNumber, shipmentUuid: null, outcome: null });
      continue;
    }
    for (const match of matches) {
      const outcome = await applySnapshot(match.uuid, snapshot, source);
      outcomes.push({ trackingNumber: snapshot.trackingNumber, shipmentUuid: match.uuid, outcome });
    }
  }
  return outcomes;
};
