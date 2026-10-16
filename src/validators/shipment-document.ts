import { z } from "zod";

const fileName = z.string().trim().min(1, "The file has no name").max(255, "The file name is too long");

export const documentUploadSchema = z.object({
  shipmentUuid: z.uuid(),
  fileName,
  sizeBytes: z.number().int().positive(),
});

export type DocumentUploadValues = z.infer<typeof documentUploadSchema>;

export const documentFinishSchema = z.object({
  shipmentUuid: z.uuid(),
  documentUuid: z.uuid(),
  fileName,
});

export type DocumentFinishValues = z.infer<typeof documentFinishSchema>;

export const documentDeleteSchema = z.object({
  shipmentUuid: z.uuid(),
  documentUuids: z.array(z.uuid()).max(100),
});

export type DocumentDeleteValues = z.infer<typeof documentDeleteSchema>;
