"use client";

import { Check, ChevronDown } from "lucide-react";
import { useDropdown } from "@/components/ui/use-dropdown";

export type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/** The one select control in the app; a native <select> is never used. */
export const Dropdown = ({
  value,
  onChange,
  options,
  placeholder = "Choose…",
  invalid = false,
  disabled = false,
  id,
  className = "",
}: DropdownProps) => {
  const { open, setOpen, rootRef, listRef, query, setQuery, visible, onKeyDown } =
    useDropdown(options);
  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-control border bg-surface px-3 py-2 text-start text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 ${
          invalid ? "border-danger" : "border-hairline focus:border-primary"
        } ${selected ? "text-ink" : "text-faint"}`}
      >
        <span className="line-clamp-1">{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className="shrink-0 text-faint" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-48 animate-fade-in rounded-control border border-hairline bg-overlay shadow-lg">
          {options.length > 8 && (
            <div className="border-b border-hairline p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type to filter"
                className="w-full rounded-control border border-hairline px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          )}
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {visible.length === 0 && (
              <li className="px-3 py-2 text-sm text-faint">Nothing matches</li>
            )}
            {visible.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value || "__empty"} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-control px-3 py-2 text-start text-sm hover:bg-hover ${
                      isSelected ? "text-primary" : "text-ink"
                    }`}
                  >
                    <span className="line-clamp-1">{option.label}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
