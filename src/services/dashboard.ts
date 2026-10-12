import { and, asc, count, desc, eq, gte, isNotNull, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { ShipmentStatus, shipmentStatuses } from "@/db/enum";
import { SelectShipments, SelectTrackingEvents, Shipments, TrackingEvents } from "@/db/schema";

export type StatusCounts = Record<ShipmentStatus, number> & { total: number };

/** One row of the by-country breakdown: a country and how many shipments in each status. */
export type CountryBreakdown = {
  country: string;
  counts: StatusCounts;
};

/** A carrier event with enough of its shipment to name it. */
export type RecentEvent = Pick<
  SelectTrackingEvents,
  "uuid" | "occurredAt" | "isEstimated" | "description" | "location" | "containerNumber"
> & {
  shipmentUuid: SelectShipments["uuid"];
  trackingNumber: SelectShipments["trackingNumber"];
  vesselName: SelectShipments["vesselName"];
  carrier: SelectShipments["carrier"];
};

export type DashboardData = {
  statusCounts: StatusCounts;
  byLoadingCountry: CountryBreakdown[];
  byDischargeCountry: CountryBreakdown[];
  arrivingSoon: SelectShipments[];
  overdue: SelectShipments[];
  recentEvents: RecentEvent[];
};

const emptyCounts = (): StatusCounts => ({
  total: 0,
  pending: 0,
  sailing: 0,
  arrived: 0,
  delivered: 0,
});

const isStatus = (value: string): value is ShipmentStatus =>
  (shipmentStatuses as readonly string[]).includes(value);

const countsByStatus = async (): Promise<StatusCounts> => {
  const rows = await db
    .select({ status: Shipments.status, total: count() })
    .from(Shipments)
    .groupBy(Shipments.status);
  const counts = emptyCounts();
  for (const row of rows) {
    const total = Number(row.total);
    counts[row.status] = total;
    counts.total += total;
  }
  return counts;
};

const breakdownBy = async (side: "loading" | "discharge"): Promise<CountryBreakdown[]> => {
  const column = side === "loading" ? Shipments.loadingCountry : Shipments.dischargeCountry;
  const rows = await db
    .select({ country: column, status: Shipments.status, total: count() })
    .from(Shipments)
    .groupBy(column, Shipments.status)
    .orderBy(asc(column));

  const byCountry = new Map<string, StatusCounts>();
  for (const row of rows) {
    const counts = byCountry.get(row.country) ?? emptyCounts();
    const total = Number(row.total);
    if (isStatus(row.status)) {
      counts[row.status] += total;
    }
    counts.total += total;
    byCountry.set(row.country, counts);
  }
  return [...byCountry.entries()]
    .map(([country, counts]) => ({ country, counts }))
    .sort((a, b) => b.counts.total - a.counts.total);
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const recentEvents = (): Promise<RecentEvent[]> =>
  db
    .select({
      uuid: TrackingEvents.uuid,
      occurredAt: TrackingEvents.occurredAt,
      isEstimated: TrackingEvents.isEstimated,
      description: TrackingEvents.description,
      location: TrackingEvents.location,
      containerNumber: TrackingEvents.containerNumber,
      shipmentUuid: Shipments.uuid,
      trackingNumber: Shipments.trackingNumber,
      vesselName: Shipments.vesselName,
      carrier: Shipments.carrier,
    })
    .from(TrackingEvents)
    .innerJoin(Shipments, eq(TrackingEvents.shipmentUuid, Shipments.uuid))
    .where(eq(TrackingEvents.isEstimated, false))
    .orderBy(desc(TrackingEvents.occurredAt), desc(TrackingEvents.id))
    .limit(10);

export const getDashboardData = async (): Promise<DashboardData> => {
  const today = startOfToday();
  const inTwoWeeks = new Date(today.getTime() + 14 * 86_400_000);
  const stillMoving = and(
    isNotNull(Shipments.eta),
    ne(Shipments.status, "arrived"),
    ne(Shipments.status, "delivered"),
  );

  const [statusCounts, byLoadingCountry, byDischargeCountry, arrivingSoon, overdue, events] =
    await Promise.all([
      countsByStatus(),
      breakdownBy("loading"),
      breakdownBy("discharge"),
      db
        .select()
        .from(Shipments)
        .where(and(stillMoving, gte(Shipments.eta, today), lt(Shipments.eta, inTwoWeeks)))
        .orderBy(asc(Shipments.eta))
        .limit(8),
      db
        .select()
        .from(Shipments)
        .where(and(stillMoving, lt(Shipments.eta, today)))
        .orderBy(asc(Shipments.eta))
        .limit(8),
      recentEvents(),
    ]);

  return {
    statusCounts,
    byLoadingCountry,
    byDischargeCountry,
    arrivingSoon,
    overdue,
    recentEvents: events,
  };
};
