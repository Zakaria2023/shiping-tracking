import { ArrowRight, CircleAlert, Lock, Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteShipmentButton } from "@/components/shipments/delete-shipment-button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  carrierLabel,
  containerSummary,
  formatPrice,
  formatWeight,
  shipmentTitle,
  totalPrice,
  totalWeightKg,
} from "@/lib/shipment-display";
import { ShipmentWithCargo } from "@/services/shipments";
import { countryName, formatDate, formatDateTime, relativeDays } from "@/utils";

type ShipmentsTableProps = {
  shipments: ShipmentWithCargo[];
};

const HEAD_CLASS = "px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-muted";
const CELL_CLASS = "px-4 py-3 align-top text-sm";

export const ShipmentsTable = ({ shipments }: ShipmentsTableProps) => (
  <div className="overflow-x-auto rounded-card border border-hairline bg-surface">
    <table className="w-full min-w-240 border-collapse">
      <thead className="border-b border-hairline bg-hover">
        <tr>
          <th className={HEAD_CLASS}>Status</th>
          <th className={HEAD_CLASS}>Customer</th>
          <th className={HEAD_CLASS}>Shipment</th>
          <th className={HEAD_CLASS}>Route</th>
          <th className={HEAD_CLASS}>Cargo</th>
          <th className={HEAD_CLASS}>Price</th>
          <th className={HEAD_CLASS}>ETD</th>
          <th className={HEAD_CLASS}>ETA</th>
          <th className={HEAD_CLASS}>Destination</th>
          <th className={HEAD_CLASS}>Last update</th>
          <th className={HEAD_CLASS}>
            <span className="sr-only">Actions</span>
          </th>
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
            <td className={`${CELL_CLASS} text-ink`}>{shipment.customerName || "—"}</td>
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
              <p className="text-ink">{containerSummary(shipment.cargoLines) || "—"}</p>
              <p className="text-xs text-muted">{formatWeight(totalWeightKg(shipment.cargoLines))}</p>
            </td>
            <td className={`${CELL_CLASS} tabular whitespace-nowrap text-ink`}>
              {formatPrice(totalPrice(shipment.cargoLines), shipment.priceCurrency)}
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
              {shipment.lastEventDescription ? (
                <p className="line-clamp-1 text-xs text-muted">{shipment.lastEventDescription}</p>
              ) : (
                shipment.nextLocation && (
                  <p className="line-clamp-1 text-xs text-muted">Next: {shipment.nextLocation}</p>
                )
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
            <td className={`${CELL_CLASS} whitespace-nowrap text-end`}>
              <Link
                href={`/shipments/${shipment.uuid}/edit`}
                aria-label={`Edit ${shipmentTitle(shipment)}`}
                title="Edit"
                className="relative z-10 inline-flex rounded-control p-1.5 text-muted hover:bg-surface hover:text-ink"
              >
                <Pencil size={15} />
              </Link>
              <DeleteShipmentButton
                uuid={shipment.uuid}
                variant="icon"
                label={shipmentTitle(shipment)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
