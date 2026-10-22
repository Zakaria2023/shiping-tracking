import { and, asc, count, desc, eq, inArray, like, or, SQL } from "drizzle-orm";
import { db } from "@/db";
import { Carrier, ShipmentKind, ShipmentStatus } from "@/db/enum";
import {
  InsertShipmentCargoLines,
  InsertShipments,
  SelectShipmentCargoLines,
  SelectShipmentContainers,
  SelectShipmentDocuments,
  SelectShipments,
  SelectTrackingEvents,
  ShipmentCargoLines,
  ShipmentContainers,
  ShipmentDocuments,
  Shipments,
  TrackingEvents,
} from "@/db/schema";
import { buildPaginatedResult, generateUuid, ListParams, PaginatedResult, resolvePagination } from "@/utils";
import { deleteObjects } from "./storage";

export type {
  SelectShipments,
  SelectShipmentCargoLines,
  SelectShipmentContainers,
  SelectTrackingEvents,
};

export type ShipmentFilters = ListParams & {
  status?: ShipmentStatus;
  carrier?: Carrier;
  kind?: ShipmentKind;
  loadingCountry?: string;
  dischargeCountry?: string;
};

export type ShipmentFields = Omit<
  InsertShipments,
  | "id"
  | "uuid"
  | "createdAt"
  | "updatedAt"
  | "lastEventAt"
  | "lastEventDescription"
  | "lastTrackedAt"
  | "lastTrackedSource"
  | "trackingError"
>;

/** One cargo line as the form saves it; its owner and position are set here. */
export type CargoLineFields = Pick<
  InsertShipmentCargoLines,
  "grossWeightKg" | "containerCount" | "containerSize" | "price"
>;

/** A shipment with its cargo lines, in the order they were entered. */
export type ShipmentWithCargo = SelectShipments & { cargoLines: SelectShipmentCargoLines[] };

export type ShipmentDetail = {
  shipment: SelectShipments;
  cargoLines: SelectShipmentCargoLines[];
  containers: SelectShipmentContainers[];
  events: SelectTrackingEvents[];
  documents: SelectShipmentDocuments[];
};

export type CountryOptionRow = {
  code: string;
  total: number;
};

const searchFilter = (search?: string): SQL | undefined => {
  const term = search?.trim();
  if (!term) {
    return undefined;
  }
  const pattern = `%${term}%`;
  return or(
    like(Shipments.customerName, pattern),
    like(Shipments.trackingNumber, pattern),
    like(Shipments.vesselName, pattern),
    like(Shipments.portOfLoading, pattern),
    like(Shipments.portOfDischarge, pattern),
    like(Shipments.carrierName, pattern),
  );
};

const filtersToWhere = (filters: ShipmentFilters): SQL | undefined =>
  and(
    searchFilter(filters.search),
    filters.status ? eq(Shipments.status, filters.status) : undefined,
    filters.carrier ? eq(Shipments.carrier, filters.carrier) : undefined,
    filters.kind ? eq(Shipments.kind, filters.kind) : undefined,
    filters.loadingCountry ? eq(Shipments.loadingCountry, filters.loadingCountry) : undefined,
    filters.dischargeCountry
      ? eq(Shipments.dischargeCountry, filters.dischargeCountry)
      : undefined,
  );

const cargoLinesOf = (shipmentUuids: string[]): Promise<SelectShipmentCargoLines[]> =>
  shipmentUuids.length
    ? db
        .select()
        .from(ShipmentCargoLines)
        .where(inArray(ShipmentCargoLines.shipmentUuid, shipmentUuids))
        .orderBy(asc(ShipmentCargoLines.position), asc(ShipmentCargoLines.id))
    : Promise.resolve([]);

const cargoLineRows = (
  shipmentUuid: string,
  lines: CargoLineFields[],
): InsertShipmentCargoLines[] =>
  lines.map((line, position) => ({ ...line, uuid: generateUuid(), shipmentUuid, position }));

/** A filtered, paginated page of shipments, soonest ETA first. */
export const getShipmentsPage = async (
  filters: ShipmentFilters = {},
): Promise<PaginatedResult<ShipmentWithCargo>> => {
  const { page, pageSize, offset } = resolvePagination(filters.page, filters.pageSize);
  const where = filtersToWhere(filters);

  const [rows, [totals]] = await Promise.all([
    db
      .select()
      .from(Shipments)
      .where(where)
      // Delivered sink to the bottom; among the rest the nearest ETA comes
      // first, with the newest row breaking ties.
      .orderBy(
        asc(eq(Shipments.status, "delivered")),
        asc(Shipments.eta),
        desc(Shipments.id),
      )
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(Shipments).where(where),
  ]);

  const lines = await cargoLinesOf(rows.map((row) => row.uuid));
  const items = rows.map((row) => ({
    ...row,
    cargoLines: lines.filter((line) => line.shipmentUuid === row.uuid),
  }));
  return buildPaginatedResult(items, Number(totals?.total ?? 0), page, pageSize);
};

export const getShipment = async (uuid: string): Promise<ShipmentDetail | null> => {
  const [shipment] = await db.select().from(Shipments).where(eq(Shipments.uuid, uuid));
  if (!shipment) {
    return null;
  }
  const [cargoLines, containers, events, documents] = await Promise.all([
    cargoLinesOf([uuid]),
    db
      .select()
      .from(ShipmentContainers)
      .where(eq(ShipmentContainers.shipmentUuid, uuid))
      .orderBy(asc(ShipmentContainers.containerNumber)),
    db
      .select()
      .from(TrackingEvents)
      .where(eq(TrackingEvents.shipmentUuid, uuid))
      .orderBy(desc(TrackingEvents.occurredAt), desc(TrackingEvents.sequence)),
    db
      .select()
      .from(ShipmentDocuments)
      .where(eq(ShipmentDocuments.shipmentUuid, uuid))
      .orderBy(asc(ShipmentDocuments.createdAt), asc(ShipmentDocuments.id)),
  ]);
  return { shipment, cargoLines, containers, events, documents };
};

export const createShipment = async (
  fields: ShipmentFields,
  cargoLines: CargoLineFields[],
): Promise<string> => {
  const uuid = generateUuid();
  await db.transaction(async (tx) => {
    await tx.insert(Shipments).values({ ...fields, uuid });
    if (cargoLines.length) {
      await tx.insert(ShipmentCargoLines).values(cargoLineRows(uuid, cargoLines));
    }
  });
  return uuid;
};

/**
 * Save the form's fields. `needsTracking` is true when the line or the number
 * changed, or the shipment was never tracked, so the caller can pull it now.
 */
export const updateShipment = async (
  uuid: string,
  fields: ShipmentFields,
  cargoLines: CargoLineFields[],
): Promise<{ needsTracking: boolean }> => {
  const [before] = await db
    .select({
      carrier: Shipments.carrier,
      trackingNumber: Shipments.trackingNumber,
      lastTrackedAt: Shipments.lastTrackedAt,
    })
    .from(Shipments)
    .where(eq(Shipments.uuid, uuid));
  const identityChanged =
    !before ||
    before.carrier !== fields.carrier ||
    before.trackingNumber !== (fields.trackingNumber ?? null);
  await db.transaction(async (tx) => {
    await tx
      .update(Shipments)
      // A tracking error belongs to the old line and number; it says nothing about the new ones.
      .set(identityChanged ? { ...fields, trackingError: null } : fields)
      .where(eq(Shipments.uuid, uuid));
    // The form sends every line, so its list replaces the saved one.
    await tx.delete(ShipmentCargoLines).where(eq(ShipmentCargoLines.shipmentUuid, uuid));
    if (cargoLines.length) {
      await tx.insert(ShipmentCargoLines).values(cargoLineRows(uuid, cargoLines));
    }
  });
  return { needsTracking: identityChanged || before.lastTrackedAt === null };
};

/** Delete the shipment; its rows cascade, and its documents leave the bucket. */
export const deleteShipment = async (uuid: string): Promise<void> => {
  const documents = await db
    .select({ objectKey: ShipmentDocuments.objectKey })
    .from(ShipmentDocuments)
    .where(eq(ShipmentDocuments.shipmentUuid, uuid));
  await db.delete(Shipments).where(eq(Shipments.uuid, uuid));
  try {
    await deleteObjects(documents.map((document) => document.objectKey));
  } catch (error) {
    // The shipment is gone either way; a failure here only leaves stray files.
    console.error("Failed to delete the shipment's documents from storage", error);
  }
};

/** A person choosing the status: locked means a carrier refresh leaves it alone. */
export const setShipmentStatus = async (
  uuid: string,
  status: ShipmentStatus,
  currentLocation: string | null,
  nextLocation: string | null,
  locked: boolean,
): Promise<void> => {
  await db
    .update(Shipments)
    .set({
      status,
      statusLocked: locked,
      currentLocation: currentLocation ?? undefined,
      nextLocation,
      lastTrackedAt: new Date(),
      lastTrackedSource: "manual",
    })
    .where(eq(Shipments.uuid, uuid));
};

export const unlockShipmentStatus = async (uuid: string): Promise<void> => {
  await db.update(Shipments).set({ statusLocked: false }).where(eq(Shipments.uuid, uuid));
};

/** The countries that appear on a side, for the filter dropdowns. */
export const getCountriesInUse = async (
  side: "loading" | "discharge",
): Promise<CountryOptionRow[]> => {
  const column = side === "loading" ? Shipments.loadingCountry : Shipments.dischargeCountry;
  const rows = await db
    .select({ code: column, total: count() })
    .from(Shipments)
    .groupBy(column)
    .orderBy(asc(column));
  return rows.map((row) => ({ code: row.code, total: Number(row.total) }));
};
