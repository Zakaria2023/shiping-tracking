"use client";

import { FileText, Paperclip, Undo2, X } from "lucide-react";
import { ShipmentDocumentsState } from "@/app/shipments/use-shipment-documents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DOCUMENT_ACCEPT, formatFileSize } from "@/lib/shipment-documents";

type DocumentsFieldProps = {
  documents: ShipmentDocumentsState;
};

const ROW_CLASS = "flex items-center justify-between gap-3 py-2.5";
const ICON_BUTTON_CLASS =
  "shrink-0 rounded-control p-1.5 text-faint hover:bg-hover hover:text-ink disabled:opacity-60";

/** Attach files to the shipment. Nothing reaches storage until the form is saved. */
export const DocumentsField = ({ documents }: DocumentsFieldProps) => {
  const { saved, pending, removed, problems, inputRef, openPicker, onPick, removePending, toggleRemoved } =
    documents;
  const isEmpty = saved.length === 0 && pending.length === 0;

  return (
    <Card
      title="Documents"
      description="Optional. Bill of lading, invoice, packing list… PDF, images, Word or Excel, up to 25 MB each."
      actions={
        <Button variant="secondary" onClick={openPicker}>
          <Paperclip size={16} />
          Add documents
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        onChange={onPick}
        className="hidden"
      />

      {isEmpty ? (
        <p className="text-sm text-muted">No documents attached.</p>
      ) : (
        <ul className="divide-y divide-hairline-soft">
          {saved.map((document) => {
            const isRemoved = removed.includes(document.uuid);
            return (
              <li key={document.uuid} className={ROW_CLASS}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText size={16} className="shrink-0 text-faint" />
                  <div className="min-w-0">
                    <a
                      href={`/api/documents/${document.uuid}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`break-words text-sm ${isRemoved ? "text-faint line-through" : "text-ink hover:text-primary"}`}
                    >
                      {document.fileName}
                    </a>
                    <p className="text-xs text-muted">
                      {isRemoved ? "Removed when you save" : formatFileSize(document.sizeBytes)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRemoved(document.uuid)}
                  aria-label={isRemoved ? `Keep ${document.fileName}` : `Remove ${document.fileName}`}
                  title={isRemoved ? "Keep" : "Remove"}
                  className={ICON_BUTTON_CLASS}
                >
                  {isRemoved ? <Undo2 size={15} /> : <X size={15} />}
                </button>
              </li>
            );
          })}
          {pending.map((item) => (
            <li key={item.key} className={ROW_CLASS}>
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText size={16} className="shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="break-words text-sm text-ink">{item.file.name}</p>
                  <p className="text-xs text-muted">
                    {formatFileSize(item.file.size)} · uploads when you save
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePending(item.key)}
                aria-label={`Remove ${item.file.name}`}
                title="Remove"
                className={ICON_BUTTON_CLASS}
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {problems.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {problems.map((problem) => (
            <li key={problem} className="text-xs text-danger">
              {problem}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
