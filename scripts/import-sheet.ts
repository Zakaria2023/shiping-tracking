/**
 * One-off import of the rows that were in the "Vessel tracking.xlsx" workbook
 * on 2026-10-12, so the app starts with the real shipments rather than empty.
 *
 *   pnpm import:sheet
 *
 * Safe to run twice: a row whose tracking number (or vessel + weight, for a
 * bulk ship) already exists is skipped. Rows in the sheet that named no
 * shipping line were left out; add those by hand.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { Shipments } from "../db/schema/shipments";
import { ShipmentFields } from "../src/services/shipments";

type SheetRow = ShipmentFields;

const d = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const container = (
  carrier: "yang_ming" | "msc",
  trackingNumber: string,
  trackingNumberType: ShipmentFields["trackingNumberType"],
  route: [string, string, string, string],
  cargo: { kg?: number; count?: number; size?: "20" | "40" },
  dates: { etd?: Date; eta?: Date },
  status: ShipmentFields["status"],
): SheetRow => ({
  kind: "container",
  carrier,
  carrierName: null,
  trackingNumber,
  trackingNumberType,
  vesselName: null,
  voyage: null,
  portOfLoading: route[0],
  loadingCountry: route[1],
  portOfDischarge: route[2],
  dischargeCountry: route[3],
  grossWeightKg: cargo.kg ? String(cargo.kg) : null,
  containerCount: cargo.count ?? null,
  containerSize: cargo.size ?? null,
  etd: dates.etd ?? null,
  eta: dates.eta ?? null,
  status,
  statusLocked: false,
  currentLocation: null,
  notes: "Imported from Vessel tracking.xlsx (Vessel sheet)",
});

const bulk = (
  vesselName: string,
  route: [string, string, string, string],
  kg: number,
  dates: { etd?: Date; eta?: Date },
  currentLocation: string | null,
): SheetRow => ({
  kind: "bulk",
  carrier: "bulk_carrier",
  carrierName: null,
  trackingNumber: null,
  trackingNumberType: "bill_of_lading",
  vesselName,
  voyage: null,
  portOfLoading: route[0],
  loadingCountry: route[1],
  portOfDischarge: route[2],
  dischargeCountry: route[3],
  grossWeightKg: String(kg),
  containerCount: null,
  containerSize: null,
  etd: dates.etd ?? null,
  eta: dates.eta ?? null,
  status: "sailing",
  // A bulk ship is never refreshed by a carrier, so its status stays as set.
  statusLocked: true,
  currentLocation,
  notes: "Imported from Vessel tracking.xlsx (Bulk sheet)",
});

const ROWS: SheetRow[] = [
  // Vessel sheet
  container(
    "yang_ming",
    "YMJAM209075665",
    "bill_of_lading",
    ["Kaohsiung", "TW", "El Dekheila", "EG"],
    { kg: 116403, count: 5, size: "20" },
    { etd: d(2026, 8, 5) },
    "sailing",
  ),
  container(
    "yang_ming",
    "YMJAM2090076051",
    "bill_of_lading",
    ["Kaohsiung", "TW", "Damietta", "EG"],
    { kg: 25613, count: 1 },
    { etd: d(2026, 9, 4), eta: d(2026, 10, 27) },
    "sailing",
  ),
  container(
    "msc",
    "177TDFDFS902229",
    "booking",
    ["Shanghai", "CN", "Beirut", "LB"],
    { count: 2, size: "20" },
    { etd: d(2026, 8, 30), eta: d(2026, 11, 9) },
    "sailing",
  ),
  container(
    "msc",
    "MEDUWL539899",
    "bill_of_lading",
    ["Gebze", "TR", "Antwerp", "BE"],
    { kg: 82244, count: 4, size: "40" },
    { etd: d(2026, 10, 2), eta: d(2026, 10, 20) },
    "sailing",
  ),
  container(
    "msc",
    "MEDUK8095409",
    "bill_of_lading",
    ["Derince", "TR", "El Dekheila", "EG"],
    { kg: 47510, count: 2, size: "20" },
    { etd: d(2026, 9, 28), eta: d(2026, 10, 14) },
    "sailing",
  ),
  container(
    "msc",
    "MEDUWL547827",
    "bill_of_lading",
    ["Gebze", "TR", "Nhava Sheva", "IN"],
    { count: 1, size: "40" },
    {},
    "pending",
  ),
  container(
    "msc",
    "MEDUJ5911956",
    "bill_of_lading",
    ["Durban", "ZA", "Alexandria", "EG"],
    { kg: 49042, count: 2, size: "40" },
    { etd: d(2026, 9, 30), eta: d(2026, 12, 4) },
    "sailing",
  ),
  // Bulk sheet
  bulk("Xin Hai Tong", ["Shanghai", "CN", "Iskenderun", "TR"], 26854, { etd: d(2026, 6, 26), eta: d(2026, 10, 20) }, "Suez Canal"),
  bulk("Xin Hai Tong", ["Shanghai", "CN", "Iskenderun", "TR"], 152485, { etd: d(2026, 6, 26), eta: d(2026, 10, 20) }, "Suez Canal"),
  bulk("De Xin Sheng Xiang", ["Shanghai", "CN", "Diliskelesi", "TR"], 75, { etd: d(2026, 8, 29), eta: d(2026, 10, 27) }, "Kuala Lumpur"),
  bulk("Gutian Loyal", ["Shanghai", "CN", "Iskenderun", "TR"], 150848, { eta: d(2026, 10, 8) }, "Shanghai"),
  bulk("Gutian Loyal", ["Shanghai", "CN", "Iskenderun", "TR"], 260435, { eta: d(2026, 10, 8) }, "Shanghai"),
  bulk("Gutian Loyal", ["Shanghai", "CN", "Iskenderun", "TR"], 24330, { eta: d(2026, 10, 8) }, "Shanghai"),
  bulk("M/V Lucky Glory", ["Bahodopi", "ID", "Diliskelesi", "TR"], 41400, { etd: d(2026, 9, 15), eta: d(2026, 10, 25) }, null),
  bulk("M/V Lucky Glory", ["Bahodopi", "ID", "Diliskelesi", "TR"], 20000, {}, null),
];

const exists = async (row: SheetRow): Promise<boolean> => {
  const where = row.trackingNumber
    ? eq(Shipments.trackingNumber, row.trackingNumber)
    : and(
        eq(Shipments.vesselName, row.vesselName ?? ""),
        eq(Shipments.grossWeightKg, row.grossWeightKg ?? ""),
      );
  const [found] = await db.select({ id: Shipments.id }).from(Shipments).where(where).limit(1);
  return Boolean(found);
};

const run = async () => {
  let inserted = 0;
  let skipped = 0;
  for (const row of ROWS) {
    if (await exists(row)) {
      skipped += 1;
      continue;
    }
    await db.insert(Shipments).values({ ...row, uuid: crypto.randomUUID() });
    inserted += 1;
  }
  console.log(`Imported ${inserted} shipments, skipped ${skipped} already present.`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
