import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { SelectShipmentDocuments, ShipmentDocuments, Shipments } from "@/db/schema";
import { documentContentType, documentProblem, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/shipment-documents";
import { generateUuid } from "@/utils";
import { createDownloadUrl, createUploadUrl, deleteObjects, headObject } from "./storage";

export type { SelectShipmentDocuments };

export type DocumentUpload = {
  documentUuid: string;
  uploadUrl: string;
  contentType: string;
};

const objectKey = (shipmentUuid: string, documentUuid: string): string =>
  `docs/${shipmentUuid}/${documentUuid}`;

const assertShipmentExists = async (shipmentUuid: string): Promise<void> => {
  const [row] = await db
    .select({ uuid: Shipments.uuid })
    .from(Shipments)
    .where(eq(Shipments.uuid, shipmentUuid));
  if (!row) {
    throw new Error("That shipment no longer exists");
  }
};

/**
 * Step one of attaching a file: a signed URL the browser uploads it to
 * directly, so the file never passes through the app's server.
 */
export const startDocumentUpload = async (
  shipmentUuid: string,
  fileName: string,
  sizeBytes: number,
): Promise<DocumentUpload> => {
  const problem = documentProblem(fileName, sizeBytes);
  const contentType = documentContentType(fileName);
  if (problem || !contentType) {
    throw new Error(problem ?? `${fileName}: not a document type this app takes`);
  }
  await assertShipmentExists(shipmentUuid);
  const documentUuid = generateUuid();
  const uploadUrl = await createUploadUrl(objectKey(shipmentUuid, documentUuid), contentType);
  return { documentUuid, uploadUrl, contentType };
};

/** Step two: once the file is in the bucket, record it against the shipment. */
export const finishDocumentUpload = async (
  shipmentUuid: string,
  documentUuid: string,
  fileName: string,
): Promise<void> => {
  const contentType = documentContentType(fileName);
  if (!contentType) {
    throw new Error(`${fileName}: not a document type this app takes`);
  }
  const key = objectKey(shipmentUuid, documentUuid);
  const stored = await headObject(key);
  if (!stored) {
    throw new Error(`${fileName} did not reach storage`);
  }
  // The signed URL cannot cap the size, so check what actually arrived.
  if (stored.sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    await deleteObjects([key]);
    throw new Error(`${fileName}: larger than 25 MB`);
  }
  await assertShipmentExists(shipmentUuid);
  await db.insert(ShipmentDocuments).values({
    uuid: documentUuid,
    shipmentUuid,
    fileName,
    contentType,
    sizeBytes: stored.sizeBytes,
    objectKey: key,
  });
};

/** A short-lived link that opens the document, or null when there is no such document. */
export const getDocumentDownloadUrl = async (documentUuid: string): Promise<string | null> => {
  const [document] = await db
    .select()
    .from(ShipmentDocuments)
    .where(eq(ShipmentDocuments.uuid, documentUuid));
  return document ? createDownloadUrl(document.objectKey, document.fileName) : null;
};

/** Remove these documents of one shipment, from the bucket and the database. */
export const deleteShipmentDocuments = async (
  shipmentUuid: string,
  documentUuids: string[],
): Promise<void> => {
  if (documentUuids.length === 0) {
    return;
  }
  const where = and(
    eq(ShipmentDocuments.shipmentUuid, shipmentUuid),
    inArray(ShipmentDocuments.uuid, documentUuids),
  );
  const rows = await db.select({ objectKey: ShipmentDocuments.objectKey }).from(ShipmentDocuments).where(where);
  await deleteObjects(rows.map((row) => row.objectKey));
  await db.delete(ShipmentDocuments).where(where);
};
