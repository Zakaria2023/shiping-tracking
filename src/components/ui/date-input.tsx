"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "./input";
import { useDateInput } from "./use-date-input";

type DateInputProps = {
  /** "yyyy-mm-dd", or "" when no date is set. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  id?: string;
  name?: string;
};

/**
 * A date typed day first (dd/mm/yyyy), whatever the browser's locale. The
 * native date input follows the browser and shows month first on an English
 * (US) Chrome, so it only backs the calendar button here.
 */
export const DateInput = ({ value, onChange, onBlur, invalid = false, id, name }: DateInputProps) => {
  const { text, onTextChange, pickerRef, pickerValue, openPicker, onPick } = useDateInput(
    value,
    onChange,
  );

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={text}
        onChange={onTextChange}
        onBlur={onBlur}
        invalid={invalid}
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        className="tabular pe-10"
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label="Choose a date"
        className="absolute end-1 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-faint hover:text-ink"
      >
        <CalendarDays size={16} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={pickerValue}
        onChange={onPick}
        className="pointer-events-none absolute bottom-0 start-0 h-0 w-0 opacity-0"
      />
    </div>
  );
};
