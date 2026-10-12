"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export type FilterKey = "search" | "status" | "carrier" | "kind" | "from" | "to";

const FILTER_KEYS: FilterKey[] = ["search", "status", "carrier", "kind", "from", "to"];

/** The list filters live in the URL, so a filtered view can be shared and refreshed. */
export const useShipmentFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = (key: FilterKey) => searchParams.get(key) ?? "";

  const setFilter = (key: FilterKey, next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set(key, next);
    } else {
      params.delete(key);
    }
    // A new filter starts from the first page.
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const clearAll = () => router.replace(pathname);

  // The search box is typed into, so it waits a moment before touching the
  // URL. Once the URL carries the typed text the effect finds nothing to do.
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  useEffect(() => {
    const typed = search.trim();
    if (typed === (searchParams.get("search") ?? "")) {
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (typed) {
        params.set("search", typed);
      } else {
        params.delete("search");
      }
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, searchParams, pathname, router]);

  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  return { value, setFilter, clearAll, search, setSearch, hasFilters };
};
