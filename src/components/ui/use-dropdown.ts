"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { DropdownOption } from "@/components/ui/dropdown";

/** Open/close, outside-click, Escape, and the filter box of the Dropdown. */
export const useDropdown = (options: DropdownOption[]) => {
  const [open, setOpenState] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Closing also clears the filter, so the next open shows every option.
  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next) {
      setQuery("");
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenState(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return { open, setOpen, rootRef, listRef, query, setQuery, visible, onKeyDown };
};
