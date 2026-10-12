import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  datetime,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { Shipments } from "./shipments";

/**
 * One milestone the carrier reported: loaded, departed, transshipped, arrived.
 * A refresh re-reads the whole history, so each row carries a fingerprint and
 * the unique index makes a repeated event a no-op instead of a duplicate.
 */
export const TrackingEvents = mysqlTable(
  "TrackingEvents",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    shipmentUuid: char("shipment_uuid", { length: 36 })
      .notNull()
      .references(() => Shipments.uuid, { onDelete: "cascade" }),

    // Null when the event is about the whole shipment (Yang Ming's routing
    // schedule) rather than one box (MSC's per-container events).
    containerNumber: varchar("container_number", { length: 20 }),

    occurredAt: datetime("occurred_at").notNull(),
    isEstimated: boolean("is_estimated").notNull().default(false),
    description: varchar("description", { length: 160 }).notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    locationCode: varchar("location_code", { length: 10 }),
    vesselName: varchar("vessel_name", { length: 120 }),
    voyage: varchar("voyage", { length: 40 }),
    // The carrier's own ordering, kept so ties on the same day sort as they do
    // on the carrier's page.
    sequence: int("sequence").notNull().default(0),

    fingerprint: char("fingerprint", { length: 40 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_tracking_events_shipment").on(
      table.shipmentUuid,
      table.occurredAt,
    ),
    uniqueIndex("uq_tracking_events_fingerprint").on(
      table.shipmentUuid,
      table.fingerprint,
    ),
  ],
);

export type SelectTrackingEvents = InferSelectModel<typeof TrackingEvents>;
export type InsertTrackingEvents = InferInsertModel<typeof TrackingEvents>;
