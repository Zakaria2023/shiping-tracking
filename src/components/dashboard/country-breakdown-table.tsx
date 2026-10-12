import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ShipmentStatus, shipmentStatuses } from "@/db/enum";
import { SHIPMENT_STATUS_LABELS } from "@/db/label";
import { CountryBreakdown } from "@/services/dashboard";
import { countryName } from "@/utils";

type CountryBreakdownTableProps = {
  title: string;
  description: string;
  rows: CountryBreakdown[];
  filterKey: "from" | "to";
};

const STATUS_TEXT: Record<ShipmentStatus, string> = {
  pending: "text-pending",
  sailing: "text-sailing",
  arrived: "text-arrived",
  delivered: "text-delivered",
};

export const CountryBreakdownTable = ({
  title,
  description,
  rows,
  filterKey,
}: CountryBreakdownTableProps) => (
  <Card title={title} description={description}>
    {rows.length === 0 ? (
      <p className="text-sm text-muted">No shipments yet.</p>
    ) : (
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline text-xs uppercase tracking-wide text-muted">
            <th className="py-2 text-start font-medium">Country</th>
            <th className="py-2 text-end font-medium">Total</th>
            {shipmentStatuses.map((status) => (
              <th key={status} className={`py-2 text-end font-medium ${STATUS_TEXT[status]}`}>
                {SHIPMENT_STATUS_LABELS[status]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.country} className="border-b border-hairline-soft text-sm last:border-b-0">
              <td className="py-2">
                <Link
                  href={`/shipments?${filterKey}=${row.country}`}
                  className="text-ink hover:text-primary hover:underline"
                >
                  {countryName(row.country)}
                </Link>
              </td>
              <td className="py-2 text-end font-mono tabular text-ink">{row.counts.total}</td>
              {shipmentStatuses.map((status) => (
                <td key={status} className="py-2 text-end font-mono tabular">
                  {row.counts[status] ? (
                    <Link
                      href={`/shipments?${filterKey}=${row.country}&status=${status}`}
                      className={`${STATUS_TEXT[status]} hover:underline`}
                    >
                      {row.counts[status]}
                    </Link>
                  ) : (
                    <span className="text-faint">·</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </Card>
);
