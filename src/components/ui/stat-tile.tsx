import Link from "next/link";
import { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "ink" | "pending" | "sailing" | "arrived" | "delivered";
  href?: string;
};

const TONE_CLASSES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  ink: "bg-primary-tint text-primary",
  pending: "bg-pending-tint text-pending",
  sailing: "bg-sailing-tint text-sailing",
  arrived: "bg-arrived-tint text-arrived",
  delivered: "bg-delivered-tint text-delivered",
};

export const StatTile = ({ label, value, icon, tone = "ink", href }: StatTileProps) => (
  <div className="relative flex items-center gap-4 rounded-card border border-hairline bg-surface px-5 py-4 hover:bg-hover">
    {href && <Link href={href} aria-label={label} className="absolute inset-0" />}
    <span className={`flex h-10 w-10 items-center justify-center rounded-control ${TONE_CLASSES[tone]}`}>
      {icon}
    </span>
    <div>
      <p className="font-mono text-2xl tabular text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  </div>
);
