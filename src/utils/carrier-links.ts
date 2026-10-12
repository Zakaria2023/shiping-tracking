import { Carrier, TrackingNumberType } from "@/db/enum";

/**
 * The carrier's own tracking page for a number — the "Website" column of the
 * sheet, built rather than pasted so it can never point at the wrong shipment.
 */

export const yangMingTrackingUrl = (trackingNumber: string): string =>
  `https://www.yangming.com/en/esolution/tracking/cargo_tracking?service=${encodeURIComponent(trackingNumber.trim())}`;

/**
 * MSC encodes the search in a base64 `params` query, exactly as the links in
 * the sheet do. Mode 0 is container / bill of lading, mode 1 is booking.
 */
export const mscTrackingUrl = (
  trackingNumber: string,
  numberType: TrackingNumberType,
): string => {
  const mode = numberType === "booking" ? 1 : 0;
  const params = `trackingNumber=${trackingNumber.trim()}&trackingMode=${mode}`;
  const encoded =
    typeof btoa === "function"
      ? btoa(params)
      : Buffer.from(params, "utf8").toString("base64");
  return `https://www.msc.com/en/track-a-shipment?params=${encoded}`;
};

export const carrierTrackingUrl = (
  carrier: Carrier,
  trackingNumber: string | null,
  numberType: TrackingNumberType,
): string | null => {
  if (!trackingNumber) {
    return null;
  }
  if (carrier === "yang_ming") {
    return yangMingTrackingUrl(trackingNumber);
  }
  if (carrier === "msc") {
    return mscTrackingUrl(trackingNumber, numberType);
  }
  return null;
};
