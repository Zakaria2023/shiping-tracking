"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
};

export const Pagination = ({ page, totalPages, total }: PaginationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return <p className="text-sm text-muted">{total} shipments</p>;
  }

  const linkClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-control border border-hairline bg-surface text-muted hover:bg-hover aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Page {page} of {totalPages} · {total} shipments
      </p>
      <div className="flex items-center gap-2">
        <Link href={hrefFor(page - 1)} aria-disabled={page <= 1} className={linkClass}>
          <ChevronLeft size={16} />
        </Link>
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= totalPages}
          className={linkClass}
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};
