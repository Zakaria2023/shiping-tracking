"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toShipmentFields } from "@/lib/shipment-form-values";
import {
  createShipment,
  deleteShipment,
  ingestMscTrackingInfo,
  refreshAllYangMing,
  refreshYangMingShipment,
  setShipmentStatus,
  unlockShipmentStatus,
  updateShipment,
} from "@/services";
import { ActionResult, fail } from "@/utils";
import {
  ShipmentFormValues,
  shipmentFormSchema,
  StatusUpdateValues,
  statusUpdateSchema,
} from "@/validators/shipment";

export type MessageResult = ActionResult & { message?: string };

const revalidateShipment = (uuid?: string) => {
  revalidatePath("/");
  revalidatePath("/shipments");
  if (uuid) {
    revalidatePath(`/shipments/${uuid}`);
  }
};

export const createShipmentAction = async (
  _prevState: ActionResult,
  values: ShipmentFormValues,
): Promise<ActionResult> => {
  const parsed = shipmentFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  let uuid: string;
  try {
    uuid = await createShipment(toShipmentFields(parsed.data));
  } catch (error) {
    return fail(error, "Failed to create the shipment");
  }
  revalidateShipment(uuid);
  redirect(`/shipments/${uuid}`);
};

export const updateShipmentAction = async (
  uuid: string,
  _prevState: ActionResult,
  values: ShipmentFormValues,
): Promise<ActionResult> => {
  const parsed = shipmentFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  try {
    // Editing the form never touches the lock; the status editor owns that.
    const { statusLocked: _ignored, ...fields } = toShipmentFields(parsed.data);
    void _ignored;
    await updateShipment(uuid, fields);
  } catch (error) {
    return fail(error, "Failed to save the shipment");
  }
  revalidateShipment(uuid);
  redirect(`/shipments/${uuid}`);
};

export const deleteShipmentAction = async (uuid: string): Promise<ActionResult> => {
  try {
    await deleteShipment(uuid);
  } catch (error) {
    return fail(error, "Failed to delete the shipment");
  }
  revalidateShipment();
  redirect("/shipments");
};

export const setStatusAction = async (
  uuid: string,
  _prevState: MessageResult,
  values: StatusUpdateValues,
): Promise<MessageResult> => {
  const parsed = statusUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  try {
    await setShipmentStatus(
      uuid,
      parsed.data.status,
      parsed.data.currentLocation?.trim() || null,
      parsed.data.locked,
    );
  } catch (error) {
    return fail(error, "Failed to update the status");
  }
  revalidateShipment(uuid);
  return { success: true, message: "Status saved" };
};

export const unlockStatusAction = async (uuid: string): Promise<MessageResult> => {
  try {
    await unlockShipmentStatus(uuid);
  } catch (error) {
    return fail(error, "Failed to unlock the status");
  }
  revalidateShipment(uuid);
  return { success: true, message: "The carrier sets the status again" };
};

/** Pull one Yang Ming shipment now. */
export const refreshShipmentAction = async (uuid: string): Promise<MessageResult> => {
  try {
    const outcome = await refreshYangMingShipment(uuid);
    revalidateShipment(uuid);
    return {
      success: true,
      message: outcome.newEvents
        ? `${outcome.newEvents} new event${outcome.newEvents === 1 ? "" : "s"} from Yang Ming`
        : "Up to date with Yang Ming",
    };
  } catch (error) {
    revalidateShipment(uuid);
    return fail(error, "Could not reach Yang Ming");
  }
};

/** Pull every open Yang Ming shipment. */
export const refreshAllYangMingAction = async (): Promise<MessageResult> => {
  try {
    const summary = await refreshAllYangMing();
    revalidateShipment();
    return {
      success: true,
      message: `${summary.refreshed} refreshed, ${summary.statusChanges} status change${
        summary.statusChanges === 1 ? "" : "s"
      }${summary.failed ? `, ${summary.failed} failed` : ""}`,
    };
  } catch (error) {
    return fail(error, "Refresh failed");
  }
};

/** A pasted MSC `TrackingInfo` answer, applied to this shipment. */
export const ingestMscPasteAction = async (
  uuid: string,
  _prevState: MessageResult,
  text: string,
): Promise<MessageResult> => {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { error: "That is not the MSC result. Copy the Response of the TrackingInfo request." };
  }
  try {
    const outcomes = await ingestMscTrackingInfo(payload, "msc_paste");
    const mine = outcomes.find((outcome) => outcome.shipmentUuid === uuid);
    if (!mine) {
      const numbers = outcomes.map((outcome) => outcome.trackingNumber).join(", ");
      return { error: `That result is for ${numbers}, not this shipment` };
    }
    revalidateShipment(uuid);
    return {
      success: true,
      message: mine.outcome?.newEvents
        ? `${mine.outcome.newEvents} new event${mine.outcome.newEvents === 1 ? "" : "s"} from MSC`
        : "Up to date with MSC",
    };
  } catch (error) {
    return fail(error, "Could not read the MSC result");
  }
};
