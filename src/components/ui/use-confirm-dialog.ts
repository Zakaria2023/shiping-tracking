"use client";

import { MouseEvent, SyntheticEvent, useEffect, useRef } from "react";

/**
 * Keeps a native <dialog> in step with `open`, shown as a modal so it sits
 * above everything, traps focus and blocks the page. Escape and a click on the
 * backdrop cancel, except while the action is running.
 */
export const useConfirmDialog = (open: boolean, isPending: boolean, onCancel: () => void) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Escape: the browser would close the dialog on its own; route it through
  // onCancel so `open` stays the one source of truth.
  const onCancelEvent = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!isPending) {
      onCancel();
    }
  };

  // The panel fills the dialog, so a click landing on the dialog itself is on the backdrop.
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && !isPending) {
      onCancel();
    }
  };

  return { dialogRef, onCancelEvent, onBackdropClick };
};
