import { Anchor, Clock, Container, Ship } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectShipments } from "@/db/schema/shipments";
import { SelectTrackingEvents } from "@/db/schema/tracking-events";
import { browserOnlyCarriers, isAutoTrackedCarrier } from "@/lib/carrier-tracking";
import { carrierLabel } from "@/lib/shipment-display";
import { formatDateTime } from "@/utils";

type TrackingTimelineProps = {
  events: SelectTrackingEvents[];
  shipment: SelectShipments;
};

const iconFor = (event: SelectTrackingEvents) => {
  if (event.isEstimated) {
    return Clock;
  }
  if (/arriv|discharg|berth/i.test(event.description)) {
    return Anchor;
  }
  if (event.containerNumber) {
    return Container;
  }
  return Ship;
};

const emptyDescription = (shipment: SelectShipments): string => {
  if (shipment.kind === "bulk") {
    return "A bulk ship has no carrier events; its status and location are kept manually.";
  }
  if (isAutoTrackedCarrier(shipment.carrier)) {
    return shipment.trackingError
      ? `${carrierLabel(shipment)} did not answer with this shipment; check the number, then press Refresh.`
      : `Press Refresh to pull the tracking from ${carrierLabel(shipment)}.`;
  }
  if (shipment.carrier === "msc") {
    return "Open the MSC page with the extension installed, or paste the MSC result below.";
  }
  if ((browserOnlyCarriers as readonly string[]).includes(shipment.carrier)) {
    return `${carrierLabel(shipment)} only shows tracking to a real browser, so open its page and keep the status manually.`;
  }
  return "Nothing tracks this line automatically; keep the status manually.";
};

export const TrackingTimeline = ({ events, shipment }: TrackingTimelineProps) => {
  if (events.length === 0) {
    return (
      <Card title="Tracking">
        <EmptyState title="No events yet" description={emptyDescription(shipment)} />
      </Card>
    );
  }

  const upcoming = events.filter((event) => event.isEstimated);
  const past = events.filter((event) => !event.isEstimated);

  return (
    <Card title="Tracking" description="Newest first. Estimated steps are shown above the ones that happened.">
      <ol className="relative ms-3 border-s border-hairline">
        {[...upcoming, ...past].map((event) => {
          const Icon = iconFor(event);
          return (
            <li key={event.uuid} className="relative mb-6 ps-7 last:mb-0">
              <span
                className={`absolute -start-3 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                  event.isEstimated
                    ? "border-hairline bg-surface text-faint"
                    : "border-primary-tint-border bg-primary-tint text-primary"
                }`}
              >
                <Icon size={13} />
              </span>
              <p className={`text-sm ${event.isEstimated ? "text-muted" : "text-ink"}`}>
                {event.description}
                {event.isEstimated && (
                  <span className="ms-2 rounded-full bg-hover px-2 py-0.5 text-xs text-faint">estimated</span>
                )}
              </p>
              <p className="text-sm text-muted">
                {event.location}
                {event.locationCode ? ` · ${event.locationCode}` : ""}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-faint">
                <span className="tabular">{formatDateTime(event.occurredAt)}</span>
                {event.vesselName && (
                  <span>
                    {event.vesselName}
                    {event.voyage ? ` ${event.voyage}` : ""}
                  </span>
                )}
                {event.containerNumber && <span className="font-mono">{event.containerNumber}</span>}
              </p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};
