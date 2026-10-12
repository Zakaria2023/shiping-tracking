import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { SelectShipments } from "@/db/schema/shipments";
import { carrierLabel, shipmentTitle } from "@/lib/shipment-display";
import { countryName, formatDate, relativeDays } from "@/utils";

type ArrivalsListProps = {
  title: string;
  empty: string;
  shipments: SelectShipments[];
  tone?: "ink" | "pending";
};

export const ArrivalsList = ({ title, empty, shipments, tone = "ink" }: ArrivalsListProps) => (
  <Card title={title}>
    {shipments.length === 0 ? (
      <p className="text-sm text-muted">{empty}</p>
    ) : (
      <ul className="divide-y divide-hairline-soft">
        {shipments.map((shipment) => (
          <li key={shipment.uuid} className="relative flex items-center justify-between gap-3 py-2.5 hover:bg-hover">
            <Link
              href={`/shipments/${shipment.uuid}`}
              aria-label={`Open ${shipmentTitle(shipment)}`}
              className="absolute inset-0"
            />
            <div className="min-w-0">
              <p className="font-mono text-sm text-ink">{shipmentTitle(shipment)}</p>
              <p className="line-clamp-1 text-xs text-muted">
                {carrierLabel(shipment)} · to {countryName(shipment.dischargeCountry)}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className={`text-sm tabular ${tone === "pending" ? "text-pending" : "text-ink"}`}>
                {formatDate(shipment.eta)}
              </p>
              <p className="text-xs text-muted">{relativeDays(shipment.eta)}</p>
            </div>
            <span className="relative z-10 hidden sm:block">
              <StatusPill status={shipment.status} />
            </span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
