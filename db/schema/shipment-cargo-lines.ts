import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  char,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
} from "drizzle-orm/mysql-core";
import { containerSizes } from "../enum";
import { Shipments } from "./shipments";

/**
 * One line of what a shipment carries: a weight, and for a container shipment
 * how many boxes of which size, with its price. A shipment has one or more;
 * the price is in the shipment's currency.
 */
export const ShipmentCargoLines = mysqlTable(
  "ShipmentCargoLines",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    shipmentUuid: char("shipment_uuid", { length: 36 })
      .notNull()
      .references(() => Shipments.uuid, { onDelete: "cascade" }),
    // The order the lines were entered in, from 0.
    position: int("position").notNull(),

    grossWeightKg: decimal("gross_weight_kg", { precision: 14, scale: 3 }),
    containerCount: int("container_count"),
    containerSize: mysqlEnum("container_size", containerSizes),
    price: decimal("price", { precision: 14, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_shipment_cargo_lines_shipment").on(table.shipmentUuid)],
);

export type SelectShipmentCargoLines = InferSelectModel<typeof ShipmentCargoLines>;
export type InsertShipmentCargoLines = InferInsertModel<typeof ShipmentCargoLines>;
