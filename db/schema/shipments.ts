import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  carriers,
  containerSizes,
  currencies,
  shipmentKinds,
  shipmentStatuses,
  trackingNumberTypes,
  trackingSources,
} from "../enum";

export const Shipments = mysqlTable(
  "Shipments",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    kind: mysqlEnum("kind", shipmentKinds).notNull().default("container"),
    // The shipping line — the sheet's "Company" column.
    carrier: mysqlEnum("carrier", carriers).notNull(),
    // Only read when carrier is "other" (or a bulk charterer worth naming).
    carrierName: varchar("carrier_name", { length: 120 }),

    // Bill of lading / booking / container number. Null for a bulk shipment,
    // which is identified by its vessel instead.
    trackingNumber: varchar("tracking_number", { length: 64 }),
    trackingNumberType: mysqlEnum("tracking_number_type", trackingNumberTypes)
      .notNull()
      .default("bill_of_lading"),

    vesselName: varchar("vessel_name", { length: 120 }),
    voyage: varchar("voyage", { length: 40 }),

    // Port name as written, plus the ISO 3166 alpha-2 country it sits in. The
    // country is its own column because it is what the filters group on.
    portOfLoading: varchar("port_of_loading", { length: 120 }).notNull(),
    loadingCountry: char("loading_country", { length: 2 }).notNull(),
    portOfDischarge: varchar("port_of_discharge", { length: 120 }).notNull(),
    dischargeCountry: char("discharge_country", { length: 2 }).notNull(),

    grossWeightKg: decimal("gross_weight_kg", { precision: 14, scale: 3 }),
    containerCount: int("container_count"),
    containerSize: mysqlEnum("container_size", containerSizes),

    // What the shipment costs. Optional: older rows were saved without one.
    price: decimal("price", { precision: 14, scale: 2 }),
    priceCurrency: mysqlEnum("price_currency", currencies).notNull().default("USD"),

    etd: date("etd"),
    eta: date("eta"),

    status: mysqlEnum("status", shipmentStatuses).notNull().default("pending"),
    // Set when a person chose the status by hand. A carrier refresh then keeps
    // updating events and the ETA but leaves the status alone until unlocked.
    statusLocked: boolean("status_locked").notNull().default(false),

    // Where the goods are now: typed for a bulk ship, taken from the latest
    // carrier event for a container shipment.
    currentLocation: varchar("current_location", { length: 160 }),
    lastEventAt: datetime("last_event_at"),
    lastEventDescription: varchar("last_event_description", { length: 160 }),

    lastTrackedAt: datetime("last_tracked_at"),
    lastTrackedSource: mysqlEnum("last_tracked_source", trackingSources),
    trackingError: text("tracking_error"),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_shipments_tracking_number").on(table.trackingNumber),
    index("idx_shipments_status").on(table.status),
    index("idx_shipments_carrier").on(table.carrier),
    index("idx_shipments_loading_country").on(table.loadingCountry),
    index("idx_shipments_discharge_country").on(table.dischargeCountry),
  ],
);

export type SelectShipments = InferSelectModel<typeof Shipments>;
export type InsertShipments = InferInsertModel<typeof Shipments>;
