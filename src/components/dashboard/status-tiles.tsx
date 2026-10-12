import { Anchor, Boxes, CircleDashed, PackageCheck, Ship } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusCounts } from "@/services/dashboard";

type StatusTilesProps = {
  counts: StatusCounts;
};

export const StatusTiles = ({ counts }: StatusTilesProps) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
    <StatTile label="All shipments" value={counts.total} icon={<Boxes size={18} />} href="/shipments" />
    <StatTile
      label="Pending"
      value={counts.pending}
      icon={<CircleDashed size={18} />}
      tone="pending"
      href="/shipments?status=pending"
    />
    <StatTile
      label="Sailing"
      value={counts.sailing}
      icon={<Ship size={18} />}
      tone="sailing"
      href="/shipments?status=sailing"
    />
    <StatTile
      label="Arrived"
      value={counts.arrived}
      icon={<Anchor size={18} />}
      tone="arrived"
      href="/shipments?status=arrived"
    />
    <StatTile
      label="Delivered"
      value={counts.delivered}
      icon={<PackageCheck size={18} />}
      tone="delivered"
      href="/shipments?status=delivered"
    />
  </div>
);
