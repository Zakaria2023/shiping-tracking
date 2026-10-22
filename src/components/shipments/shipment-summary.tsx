import { ArrowRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TRACKING_NUMBER_TYPE_LABELS, TRACKING_SOURCE_LABELS } from "@/db/label";
import { SelectShipmentCargoLines } from "@/db/schema/shipment-cargo-lines";
import { SelectShipments } from "@/db/schema/shipments";
import {
  containerSummary,
  formatPrice,
  formatWeight,
  totalPrice,
  totalWeightKg,
} from "@/lib/shipment-display";
import { countryName, formatDate, formatDateTime, relativeDays } from "@/utils";

type ShipmentSummaryProps = {
  shipment: SelectShipments;
  cargoLines: SelectShipmentCargoLines[];
};

type RowProps = {
  label: string;
  value: string;
  mono?: boolean;
};

const Row = ({ label, value, mono = false }: RowProps) =>
  value ? (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-end text-sm text-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  ) : null;

export const ShipmentSummary = ({ shipment, cargoLines }: ShipmentSummaryProps) => {
  const price = totalPrice(cargoLines);
  return (
    <Card title="Summary">
      <div className="mb-3 rounded-control bg-hover p-3">
        <p className="flex items-center gap-2 text-sm text-ink">
          <span>{countryName(shipment.loadingCountry)}</span>
          <ArrowRight size={14} className="text-faint" />
          <span>{countryName(shipment.dischargeCountry)}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {shipment.portOfLoading} → {shipment.portOfDischarge}
        </p>
      </div>
      <dl className="divide-y divide-hairline-soft">
        <Row label="Customer" value={shipment.customerName ?? "—"} />
        {shipment.trackingNumber && (
          <Row label={TRACKING_NUMBER_TYPE_LABELS[shipment.trackingNumberType]} value={shipment.trackingNumber} mono />
        )}
        <Row
          label="Vessel"
          value={[shipment.vesselName, shipment.voyage].filter(Boolean).join(" · ")}
        />
        <Row label="ETD" value={formatDate(shipment.etd)} />
        <Row
          label="ETA"
          value={
            shipment.eta
              ? `${formatDate(shipment.eta)}${shipment.status === "delivered" ? "" : ` (${relativeDays(shipment.eta)})`}`
              : ""
          }
        />
        <Row label="Containers" value={containerSummary(cargoLines)} />
        <Row label="Gross weight" value={formatWeight(totalWeightKg(cargoLines))} />
        <Row label="Price" value={formatPrice(price, shipment.priceCurrency)} mono={price !== null} />
        <Row label="Now at" value={shipment.currentLocation ?? ""} />
        <Row label="Next" value={shipment.nextLocation ?? ""} />
        <Row
          label="Last update"
          value={
            shipment.lastTrackedAt
              ? `${formatDateTime(shipment.lastTrackedAt)}${
                  shipment.lastTrackedSource ? ` · ${TRACKING_SOURCE_LABELS[shipment.lastTrackedSource]}` : ""
                }`
              : "Not yet tracked"
          }
        />
      </dl>
      {shipment.statusLocked && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Lock size={12} />
          Status set manually; carrier updates will not change it.
        </p>
      )}
      {shipment.trackingError && (
        <p className="mt-3 rounded-control bg-pending-tint px-3 py-2 text-xs text-pending">
          Last refresh failed: {shipment.trackingError}
        </p>
      )}
      {shipment.notes && (
        <p className="mt-3 whitespace-pre-wrap border-t border-hairline pt-3 text-sm text-muted">
          {shipment.notes}
        </p>
      )}
    </Card>
  );
};
