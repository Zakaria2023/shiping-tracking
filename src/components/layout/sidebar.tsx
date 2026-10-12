"use client";

import { LayoutDashboard, Plus, Ship } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Ship;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Ship },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-e border-hairline bg-surface md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b border-hairline px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-white">
          <Ship size={18} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-ink">Shipment Tracking</p>
          <p className="text-xs text-muted">Sea freight</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary-tint text-primary"
                  : "text-muted hover:bg-hover hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <Link
          href="/shipments/new"
          className="flex items-center justify-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} />
          New shipment
        </Link>
      </div>
    </aside>
  );
};
