/**
 * Throw away every stored carrier event and container and pull them again.
 *
 *   pnpm resync:tracking
 *   pnpm resync:tracking docs/carrier-samples/msc-trackinginfo-177TDFDFS902229.json
 *
 * For when the way events are read changes (a fingerprint rule, a place-name
 * rule) and the old rows would otherwise sit beside the new ones. Yang Ming
 * shipments are re-pulled from the carrier. MSC cannot be fetched from a
 * server, so any MSC `TrackingInfo` JSON files given as arguments are applied
 * instead; the rest wait for the extension's next visit. Shipment rows, their
 * notes and hand-set statuses are untouched.
 */
import { readFileSync } from "node:fs";
import { db } from "../db";
import { ShipmentContainers } from "../db/schema/shipment-containers";
import { TrackingEvents } from "../db/schema/tracking-events";
import { ingestMscTrackingInfo, refreshAllYangMing } from "../src/services";

const run = async () => {
  const deleted = await db.delete(TrackingEvents);
  const deletedBoxes = await db.delete(ShipmentContainers);
  console.log(
    `Removed ${deleted[0].affectedRows} events and ${deletedBoxes[0].affectedRows} containers.`,
  );

  const yangMing = await refreshAllYangMing();
  console.log(
    `Yang Ming: ${yangMing.refreshed} refreshed, ${yangMing.failed} failed, ${yangMing.statusChanges} status changes.`,
  );

  for (const file of process.argv.slice(2)) {
    const payload: unknown = JSON.parse(readFileSync(file, "utf8"));
    const outcomes = await ingestMscTrackingInfo(payload, "msc_paste");
    for (const outcome of outcomes) {
      console.log(
        `MSC ${outcome.trackingNumber}: ${
          outcome.shipmentUuid ? `${outcome.outcome?.status}, ${outcome.outcome?.newEvents} events` : "no matching shipment"
        }`,
      );
    }
  }
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
