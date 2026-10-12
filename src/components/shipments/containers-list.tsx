import { Card } from "@/components/ui/card";
import { SelectShipmentContainers } from "@/db/schema/shipment-containers";
import { formatDate } from "@/utils";

type ContainersListProps = {
  containers: SelectShipmentContainers[];
};

export const ContainersList = ({ containers }: ContainersListProps) => (
  <Card title="Containers" description={`${containers.length} reported by the line.`}>
    <ul className="divide-y divide-hairline-soft">
      {containers.map((box) => (
        <li key={box.uuid} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div>
            <p className="font-mono text-sm text-ink">{box.containerNumber}</p>
            <p className="text-xs text-muted">{box.containerType ?? ""}</p>
          </div>
          <div className="text-end">
            <p className="text-sm text-ink">
              {box.isDelivered ? "Delivered" : box.latestLocation ?? "—"}
            </p>
            {box.podEta && !box.isDelivered && (
              <p className="text-xs text-muted">ETA {formatDate(box.podEta)}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  </Card>
);
