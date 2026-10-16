import { FileText } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SelectShipmentDocuments } from "@/db/schema/shipment-documents";
import { formatFileSize } from "@/lib/shipment-documents";
import { formatDate } from "@/utils";

type DocumentsListProps = {
  shipmentUuid: string;
  documents: SelectShipmentDocuments[];
};

export const DocumentsList = ({ shipmentUuid, documents }: DocumentsListProps) => (
  <Card title="Documents">
    {documents.length === 0 ? (
      <p className="text-sm text-muted">
        None attached.{" "}
        <Link href={`/shipments/${shipmentUuid}/edit`} className="text-primary hover:text-primary-hover">
          Add from Edit
        </Link>
      </p>
    ) : (
      <ul className="divide-y divide-hairline-soft">
        {documents.map((document) => (
          <li key={document.uuid} className="py-2.5">
            <a
              href={`/api/documents/${document.uuid}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-start gap-2.5 text-sm text-ink hover:text-primary"
            >
              <FileText size={16} className="mt-0.5 shrink-0 text-faint" />
              <span className="min-w-0">
                <span className="block break-words">{document.fileName}</span>
                <span className="block text-xs text-muted">
                  {formatFileSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
