"use client";

import { FormEvent, startTransition, useActionState, useState } from "react";
import { ingestMscPasteAction, MessageResult } from "./actions";

export const useMscPaste = (shipmentUuid: string) => {
  const [text, setText] = useState("");
  const [state, dispatch, isPending] = useActionState(
    (prevState: MessageResult, pasted: string) =>
      ingestMscPasteAction(shipmentUuid, prevState, pasted),
    {},
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }
    startTransition(() => {
      dispatch(text);
    });
  };

  return { text, setText, state, isPending, onSubmit };
};
