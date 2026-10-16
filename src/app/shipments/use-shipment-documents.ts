"use client";

import { ChangeEvent, useRef, useState } from "react";
import { SelectShipmentDocuments } from "@/db/schema/shipment-documents";
import { documentProblem } from "@/lib/shipment-documents";
import {
  deleteDocumentsAction,
  finishDocumentUploadAction,
  startDocumentUploadAction,
} from "./actions";

type PendingDocument = {
  key: string;
  file: File;
};

/** Upload one file straight to R2, then record it. The error to show, or null. */
const uploadDocument = async (shipmentUuid: string, file: File): Promise<string | null> => {
  const start = await startDocumentUploadAction({
    shipmentUuid,
    fileName: file.name,
    sizeBytes: file.size,
  });
  if (!start.upload) {
    return start.error ?? `Could not start uploading ${file.name}`;
  }
  try {
    const response = await fetch(start.upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": start.upload.contentType },
      body: file,
    });
    if (!response.ok) {
      return `${file.name} did not upload (storage answered ${response.status})`;
    }
  } catch {
    return `${file.name} did not upload. Check the connection and try again`;
  }
  const finish = await finishDocumentUploadAction({
    shipmentUuid,
    documentUuid: start.upload.documentUuid,
    fileName: file.name,
  });
  return finish.error ?? null;
};

/**
 * The documents part of the shipment form. Files picked here wait in the
 * browser, and removals are only marked, until the shipment itself is saved:
 * a new shipment has no uuid to file them under before then.
 */
export const useShipmentDocuments = (saved: SelectShipmentDocuments[]) => {
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Clear it so picking the same file again still fires a change.
    event.target.value = "";
    setProblems(
      files
        .map((file) => documentProblem(file.name, file.size))
        .filter((problem): problem is string => problem !== null),
    );
    const accepted = files.filter((file) => !documentProblem(file.name, file.size));
    setPending((current) => [
      ...current,
      ...accepted.map((file) => ({ key: crypto.randomUUID(), file })),
    ]);
  };

  const removePending = (key: string) => {
    setPending((current) => current.filter((item) => item.key !== key));
  };

  const toggleRemoved = (uuid: string) => {
    setRemoved((current) =>
      current.includes(uuid) ? current.filter((item) => item !== uuid) : [...current, uuid],
    );
  };

  /**
   * Run once the shipment is saved: drop the marked documents, upload the new
   * ones. Files that fail stay queued so saving again retries just those.
   * Returns what went wrong, or null.
   */
  const apply = async (shipmentUuid: string): Promise<string | null> => {
    const errors: string[] = [];

    if (removed.length > 0) {
      const result = await deleteDocumentsAction({ shipmentUuid, documentUuids: removed });
      if (result.error) {
        errors.push(result.error);
      } else {
        setRemoved([]);
      }
    }

    const outcomes = await Promise.all(
      pending.map(async (item) => ({ item, error: await uploadDocument(shipmentUuid, item.file) })),
    );
    const failed = outcomes.filter((outcome) => outcome.error);
    errors.push(...failed.map((outcome) => outcome.error ?? ""));
    setPending(failed.map((outcome) => outcome.item));

    return errors.length > 0 ? errors.join(". ") : null;
  };

  return {
    saved,
    pending,
    removed,
    problems,
    inputRef,
    openPicker,
    onPick,
    removePending,
    toggleRemoved,
    apply,
  };
};

export type ShipmentDocumentsState = ReturnType<typeof useShipmentDocuments>;
