"use client";

import { ChangeEvent, useRef, useState } from "react";
import { dmyToIsoDate, isoDateToDmy } from "@/utils";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** What the form holds for the typed text: the ISO date once it is whole, else the text as typed so validation can flag it. */
const toFormValue = (text: string): string => dmyToIsoDate(text) || text.trim();

/**
 * A day-first text field kept in step with the "yyyy-mm-dd" value the form
 * holds, plus a hidden native picker behind the calendar button.
 */
export const useDateInput = (value: string, onChange: (value: string) => void) => {
  const [text, setText] = useState(() => isoDateToDmy(value) || value);
  const [synced, setSynced] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  // The value changed from outside (the picker, a form reset): show it.
  if (value !== synced) {
    setSynced(value);
    if (value !== toFormValue(text)) {
      setText(isoDateToDmy(value) || value);
    }
  }

  const onTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/[^\d/.-]/g, "").slice(0, 10);
    setText(next);
    onChange(toFormValue(next));
  };

  const openPicker = () => {
    try {
      pickerRef.current?.showPicker();
    } catch {
      pickerRef.current?.click();
    }
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return {
    text,
    onTextChange,
    pickerRef,
    pickerValue: ISO_DATE.test(value) ? value : "",
    openPicker,
    onPick,
  };
};
