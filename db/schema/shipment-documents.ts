import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { char, index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { Shipments } from "./shipments";

/** A file attached to a shipment (bill of lading, invoice, packing list…), stored in R2. */
export const ShipmentDocuments = mysqlTable(
  "ShipmentDocuments",
  {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    shipmentUuid: char("shipment_uuid", { length: 36 })
      .notNull()
      .references(() => Shipments.uuid, { onDelete: "cascade" }),

    // The name it had on the uploader's computer, shown and used on download.
    fileName: varchar("file_name", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    sizeBytes: int("size_bytes").notNull(),
    // Where it sits in the bucket: docs/{shipmentUuid}/{uuid}.
    objectKey: varchar("object_key", { length: 255 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_shipment_documents_shipment").on(table.shipmentUuid)],
);

export type SelectShipmentDocuments = InferSelectModel<typeof ShipmentDocuments>;
export type InsertShipmentDocuments = InferInsertModel<typeof ShipmentDocuments>;
