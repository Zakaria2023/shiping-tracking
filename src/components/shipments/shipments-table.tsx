import { ArrowRight, CircleAlert, Lock } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { SelectShipments } from "@/db/schema/shipments";
import {
  carrierLabel,
  containerSummary,
  formatPrice,
  formatWeight,
  shipmentTitle,
} from "@/lib/shipment-display";
import { countryName, formatDate, formatDateTime, relativeDays } from "@/utils";

type ShipmentsTableProps = {
  shipments: SelectShipments[];
};

const HEAD_CLASS = "px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-muted";
const CELL_CLASS = "px-4 py-3 align-top text-sm";

export const ShipmentsTable = ({ shipments }: ShipmentsTableProps) => (
  <div className="overflow-x-auto rounded-card border border-hairline bg-surface">
    <table className="w-full min-w-220 border-collapse">
      <thead className="border-b border-hairline bg-hover">
        <tr>
          <th className={HEAD_CLASS}>Status</th>
          <th className={HEAD_CLASS}>Shipment</th>
          <th className={HEAD_CLASS}>Route</th>
          <th className={HEAD_CLASS}>Cargo</th>
          <th className={HEAD_CLASS}>Price</th>
          <th className={HEAD_CLASS}>ETD</th>
          <th className={HEAD_CLASS}>ETA</th>
          <th className={HEAD_CLASS}>Now at</th>
          <th className={HEAD_CLASS}>Last update</th>
        </tr>
      </thead>
      <tbody>
        {shipments.map((shipment) => (
          <tr
            key={shipment.uuid}
            className="relative border-b border-hairline-soft last:border-b-0 hover:bg-hover"
          >
            <td className={CELL_CLASS}>
              <Link
                href={`/shipments/${shipment.uuid}`}
                aria-label={`Open ${shipmentTitle(shipment)}`}
                className="absolute inset-0"
              />
              <span className="flex items-center gap-1.5">
                <StatusPill status={shipment.status} />
                {shipment.statusLocked && <Lock size={12} className="text-faint" />}
              </span>
            </td>
            <td className={CELL_CLASS}>
              <p className="font-mono text-ink">{shipmentTitle(shipment)}</p>
              <p className="text-xs text-muted">
                {carrierLabel(shipment)}
                {shipment.vesselName && shipment.trackingNumber ? ` · ${shipment.vesselName}` : ""}
              </p>
            </td>
            <td className={CELL_CLASS}>
              <p className="flex items-center gap-1.5 text-ink">
                {countryName(shipment.loadingCountry)}
                <ArrowRight size={13} className="text-faint" />
                {countryName(shipment.dischargeCountry)}
              </p>
              <p className="text-xs text-muted">
                {shipment.portOfLoading} → {shipment.portOfDischarge}
              </p>
            </td>
            <td className={CELL_CLASS}>
              <p className="text-ink">{containerSummary(shipment) || "—"}</p>
              <p className="text-xs text-muted">{formatWeight(shipment.grossWeightKg)}</p>
            </td>
            <td className={`${CELL_CLASS} tabular whitespace-nowrap text-ink`}>
              {formatPrice(shipment)}
            </td>
            <td className={`${CELL_CLASS} tabular whitespace-nowrap text-ink`}>
              {formatDate(shipment.etd) || "—"}
            </td>
            <td className={`${CELL_CLASS} whitespace-nowrap`}>
              <p className="tabular text-ink">{formatDate(shipment.eta) || "—"}</p>
              {shipment.eta && shipment.status !== "delivered" && (
                <p className="text-xs text-muted">{relativeDays(shipment.eta)}</p>
              )}
            </td>
            <td className={CELL_CLASS}>
              <p className="text-ink">{shipment.currentLocation || "—"}</p>
              {shipment.lastEventDescription && (
                <p className="line-clamp-1 text-xs text-muted">{shipment.lastEventDescription}</p>
              )}
            </td>
            <td className={`${CELL_CLASS} whitespace-nowrap text-muted`}>
              {shipment.trackingError ? (
                <span className="flex items-center gap-1 text-pending">
                  <CircleAlert size={13} />
                  Needs a look
                </span>
              ) : (
                formatDateTime(shipment.lastTrackedAt) || "Never"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
