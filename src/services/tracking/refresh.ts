import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { Carrier } from "@/db/enum";
import { Shipments } from "@/db/schema/shipments";
import { ApplyOutcome, applySnapshot, recordTrackingError } from "./apply";
import { parseMscTrackingInfo } from "./msc";
import { fetchYangMingTracking } from "./yang-ming";

export type RefreshSummary = {
  refreshed: number;
  failed: number;
  statusChanges: number;
};

export type MscIngestOutcome = {
  trackingNumber: string;
  shipmentUuid: string | null;
  outcome: ApplyOutcome | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pull one Yang Ming shipment from the carrier and store it. */
export const refreshYangMingShipment = async (uuid: string): Promise<ApplyOutcome> => {
  const [shipment] = await db
    .select({ trackingNumber: Shipments.trackingNumber, carrier: Shipments.carrier })
    .from(Shipments)
    .where(eq(Shipments.uuid, uuid));
  if (!shipment) {
    throw new Error("Shipment not found");
  }
  if (shipment.carrier !== "yang_ming" || !shipment.trackingNumber) {
    throw new Error("Only a Yang Ming shipment with a tracking number can be refreshed here");
  }
  try {
    const snapshot = await fetchYangMingTracking(shipment.trackingNumber);
    return await applySnapshot(uuid, snapshot, "yang_ming");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed";
    await recordTrackingError(uuid, message);
    throw error;
  }
};

/** Whether the app can pull this shipment from the carrier itself. */
export const isAutoTracked = (shipment: { carrier: Carrier; trackingNumber?: string | null }): boolean =>
  shipment.carrier === "yang_ming" && Boolean(shipment.trackingNumber);

/**
 * Pull a Yang Ming shipment straight after it is saved, so its page opens on
 * the carrier's data. A failure is already stored on the shipment as its
 * tracking error, and the save itself stands, so nothing is thrown.
 */
export const trackAfterSave = async (uuid: string): Promise<void> => {
  try {
    await refreshYangMingShipment(uuid);
  } catch (error) {
    console.error("Tracking right after saving failed", error);
  }
};

/**
 * Every Yang Ming shipment that is not yet delivered, one at a time with a
 * pause between calls so the carrier never sees a burst from this address.
 */
export const refreshAllYangMing = async (): Promise<RefreshSummary> => {
  const rows = await db
    .select({ uuid: Shipments.uuid })
    .from(Shipments)
    .where(
      and(
        eq(Shipments.carrier, "yang_ming"),
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
      const outcome = await refreshYangMingShipment(row.uuid);
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
