import { and, asc, count, desc, eq, like, or, SQL } from "drizzle-orm";
import { db } from "@/db";
import { Carrier, ShipmentKind, ShipmentStatus } from "@/db/enum";
import {
  InsertShipments,
  SelectShipmentContainers,
  SelectShipments,
  SelectTrackingEvents,
  ShipmentContainers,
  Shipments,
  TrackingEvents,
} from "@/db/schema";
import { buildPaginatedResult, generateUuid, ListParams, PaginatedResult, resolvePagination } from "@/utils";

export type { SelectShipments, SelectShipmentContainers, SelectTrackingEvents };

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

export type ShipmentDetail = {
  shipment: SelectShipments;
  containers: SelectShipmentContainers[];
  events: SelectTrackingEvents[];
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

/** A filtered, paginated page of shipments, soonest ETA first. */
export const getShipmentsPage = async (
  filters: ShipmentFilters = {},
): Promise<PaginatedResult<SelectShipments>> => {
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

  return buildPaginatedResult(rows, Number(totals?.total ?? 0), page, pageSize);
};

export const getShipment = async (uuid: string): Promise<ShipmentDetail | null> => {
  const [shipment] = await db.select().from(Shipments).where(eq(Shipments.uuid, uuid));
  if (!shipment) {
    return null;
  }
  const [containers, events] = await Promise.all([
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
  ]);
  return { shipment, containers, events };
};

export const createShipment = async (fields: ShipmentFields): Promise<string> => {
  const uuid = generateUuid();
  await db.insert(Shipments).values({ ...fields, uuid });
  return uuid;
};

export const updateShipment = async (uuid: string, fields: ShipmentFields): Promise<void> => {
  await db.update(Shipments).set(fields).where(eq(Shipments.uuid, uuid));
};

export const deleteShipment = async (uuid: string): Promise<void> => {
  await db.delete(Shipments).where(eq(Shipments.uuid, uuid));
};

/** A person choosing the status: locked means a carrier refresh leaves it alone. */
export const setShipmentStatus = async (
  uuid: string,
  status: ShipmentStatus,
  currentLocation: string | null,
  locked: boolean,
): Promise<void> => {
  await db
    .update(Shipments)
    .set({
      status,
      statusLocked: locked,
      currentLocation: currentLocation ?? undefined,
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
