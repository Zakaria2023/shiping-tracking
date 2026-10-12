"use client";

import { ClipboardPaste } from "lucide-react";
import { useMscPaste } from "@/app/shipments/use-msc-paste";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Textarea } from "@/components/ui/textarea";

type MscPasteFormProps = {
  uuid: string;
};

/**
 * The fallback for MSC when the extension is not around: the TrackingInfo
 * response copied from the browser's developer tools, pasted here.
 */
export const MscPasteForm = ({ uuid }: MscPasteFormProps) => {
  const { text, setText, state, isPending, onSubmit } = useMscPaste(uuid);

  return (
    <Card
      title="Paste MSC result"
      description="Only needed without the extension. On the MSC page: F12 → Network → TrackingInfo → Response → copy."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='{"IsSuccess":true,"Data":{…}}'
          rows={4}
          className="font-mono text-xs"
        />
        <FormError message={state.error} />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary" disabled={isPending || !text.trim()}>
            <ClipboardPaste size={15} />
            {isPending ? "Reading…" : "Apply"}
          </Button>
          {state.message && <span className="text-sm text-muted">{state.message}</span>}
        </div>
      </form>
    </Card>
  );
};
