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

const CONTAINER_PATTERN = /^[A-Z]{4}\d{7}$/;

const isContainer = (trackingNumber: string, numberType: TrackingNumberType): boolean =>
  numberType === "container" || CONTAINER_PATTERN.test(trackingNumber.trim().toUpperCase());

/**
 * Each line's own page for a number. Where a line's page takes the number in
 * its address it opens on the result; the rest open on their search page.
 */
const TRACKING_URLS: Partial<
  Record<Carrier, (trackingNumber: string, numberType: TrackingNumberType) => string>
> = {
  yang_ming: (n) => yangMingTrackingUrl(n),
  msc: (n, type) => mscTrackingUrl(n, type),
  cosco: (n, type) =>
    `https://elines.coscoshipping.com/ebusiness/cargoTracking?trackingType=${
      isContainer(n, type) ? "CONTAINER" : type === "booking" ? "BOOKING" : "BILLOFLADING"
    }&number=${encodeURIComponent(n)}`,
  one: (n) =>
    `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?trakNoParam=${encodeURIComponent(n)}&trakNoTpCdParam=B`,
  maersk: (n) => `https://www.maersk.com/tracking/${encodeURIComponent(n)}`,
  cma_cgm: (n, type) =>
    `https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=${
      isContainer(n, type) ? "Container" : type === "booking" ? "Booking" : "BL"
    }&Reference=${encodeURIComponent(n)}`,
  hapag_lloyd: (n, type) =>
    isContainer(n, type)
      ? `https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container=${encodeURIComponent(n)}`
      : `https://www.hapag-lloyd.com/en/online-business/track/track-by-booking-solution.html?blno=${encodeURIComponent(n)}`,
  transwagon: (n, type) =>
    isContainer(n, type)
      ? `https://cs.groupwagon.com/Container_Tracking/CargoTrackingPCQuery.aspx?tbOBL_NO=&tbCNTR_NO=${encodeURIComponent(n)}`
      : `https://cs.groupwagon.com/Container_Tracking/CargoTrackingPCQuery.aspx?tbOBL_NO=${encodeURIComponent(n)}&tbCNTR_NO=`,
  oocl: () => "https://www.oocl.com/eng/ourservices/eservices/cargotracking/pages/cargotracking.aspx",
  arkas: () => "https://arkasline.com.tr/en/online-tracking/",
  turkon: () => "https://myturkonline.turkon.com/tracking",
  m_line: () => "https://tracking.mline.global/",
  tarros: () => "https://www.tarros.it/utilities/container-tracking/",
  first_flight: () => "https://firstflightme.com/",
};

export const carrierTrackingUrl = (
  carrier: Carrier,
  trackingNumber: string | null,
  numberType: TrackingNumberType,
): string | null => {
  const build = TRACKING_URLS[carrier];
  return trackingNumber && build ? build(trackingNumber.trim(), numberType) : null;
};

/** A bulk ship has no tracking number; MarineTraffic finds it by name. */
export const vesselTrackingUrl = (vesselName: string | null): string | null =>
  vesselName?.trim()
    ? `https://www.marinetraffic.com/en/ais/index/search/all/keyword:${encodeURIComponent(vesselName.trim())}`
    : null;
