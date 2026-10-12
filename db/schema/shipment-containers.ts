import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { Shipments } from "./shipments";

/** One box of a container shipment, as the carrier reports it. */
export const ShipmentContainers = mysqlTable(
  "ShipmentContainers",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    shipmentUuid: char("shipment_uuid", { length: 36 })
      .notNull()
      .references(() => Shipments.uuid, { onDelete: "cascade" }),

    containerNumber: varchar("container_number", { length: 20 }).notNull(),
    containerType: varchar("container_type", { length: 60 }),
    isDelivered: boolean("is_delivered").notNull().default(false),
    latestLocation: varchar("latest_location", { length: 160 }),
    podEta: date("pod_eta"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_shipment_containers_shipment").on(table.shipmentUuid),
    uniqueIndex("uq_shipment_containers_number").on(
      table.shipmentUuid,
      table.containerNumber,
    ),
  ],
);

export type SelectShipmentContainers = InferSelectModel<
  typeof ShipmentContainers
>;
export type InsertShipmentContainers = InferInsertModel<
  typeof ShipmentContainers
>;
