import { Anchor, CircleDashed, PackageCheck, Ship } from "lucide-react";
import { ShipmentStatus } from "@/db/enum";
import { SHIPMENT_STATUS_LABELS } from "@/db/label";

type StatusPillProps = {
  status: ShipmentStatus;
  size?: "sm" | "md";
};

const STATUS_CLASSES: Record<ShipmentStatus, string> = {
  pending: "bg-pending-tint text-pending",
  sailing: "bg-sailing-tint text-sailing",
  arrived: "bg-arrived-tint text-arrived",
  delivered: "bg-delivered-tint text-delivered",
};

const STATUS_ICONS: Record<ShipmentStatus, typeof Ship> = {
  pending: CircleDashed,
  sailing: Ship,
  arrived: Anchor,
  delivered: PackageCheck,
};

export const StatusPill = ({ status, size = "sm" }: StatusPillProps) => {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${STATUS_CLASSES[status]} ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <Icon size={size === "md" ? 14 : 12} />
      {SHIPMENT_STATUS_LABELS[status]}
    </span>
  );
};
