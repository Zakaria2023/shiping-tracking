import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CARRIER_LABELS } from "@/db/label";
import { RecentEvent } from "@/services/dashboard";
import { formatDateTime } from "@/utils";

type RecentEventsProps = {
  events: RecentEvent[];
};

export const RecentEvents = ({ events }: RecentEventsProps) => (
  <Card title="Latest carrier events">
    {events.length === 0 ? (
      <p className="text-sm text-muted">No carrier events have come in yet.</p>
    ) : (
      <ul className="divide-y divide-hairline-soft">
        {events.map((event) => (
          <li key={event.uuid} className="py-2.5">
            <p className="text-sm text-ink">{event.description}</p>
            <p className="text-xs text-muted">
              {event.location} · <span className="tabular">{formatDateTime(event.occurredAt)}</span>
            </p>
            <Link
              href={`/shipments/${event.shipmentUuid}`}
              className="font-mono text-xs text-primary hover:underline"
            >
              {event.trackingNumber ?? event.vesselName ?? CARRIER_LABELS[event.carrier]}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
