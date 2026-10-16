import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContainersList } from "@/components/shipments/containers-list";
import { DocumentsList } from "@/components/shipments/documents-list";
import { MscPasteForm } from "@/components/shipments/msc-paste-form";
import { RefreshButton } from "@/components/shipments/refresh-button";
import { ShipmentSummary } from "@/components/shipments/shipment-summary";
import { StatusEditor } from "@/components/shipments/status-editor";
import { TrackingTimeline } from "@/components/shipments/tracking-timeline";
import { StatusPill } from "@/components/ui/status-pill";
import { carrierLabel, shipmentTitle } from "@/lib/shipment-display";
import { getShipment } from "@/services";
import { carrierTrackingUrl } from "@/utils";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ShipmentPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const detail = await getShipment(uuid);
  if (!detail) {
    notFound();
  }
  const { shipment, containers, events, documents } = detail;
  const carrierUrl = carrierTrackingUrl(
    shipment.carrier,
    shipment.trackingNumber,
    shipment.trackingNumberType,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted">{carrierLabel(shipment)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl tracking-tight text-ink">
              {shipmentTitle(shipment)}
            </h1>
            <StatusPill status={shipment.status} size="md" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {shipment.carrier === "yang_ming" && shipment.trackingNumber && (
            <RefreshButton uuid={shipment.uuid} />
          )}
          {carrierUrl && (
            <a
              href={carrierUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-control border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
            >
              <ExternalLink size={16} />
              Open {carrierLabel(shipment)} page
            </a>
          )}
          <Link
            href={`/shipments/${shipment.uuid}/edit`}
            className="inline-flex items-center gap-2 rounded-control border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-hover"
          >
            <Pencil size={16} />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <TrackingTimeline events={events} shipment={shipment} />
          {containers.length > 0 && <ContainersList containers={containers} />}
        </div>
        <div className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <ShipmentSummary shipment={shipment} />
          <DocumentsList shipmentUuid={shipment.uuid} documents={documents} />
          <StatusEditor shipment={shipment} />
          {shipment.carrier === "msc" && <MscPasteForm uuid={shipment.uuid} />}
        </div>
      </div>
    </div>
  );
};

export default ShipmentPage;
