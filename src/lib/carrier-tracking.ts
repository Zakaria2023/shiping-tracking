import { Carrier, TrackingSource } from "@/db/enum";

/**
 * How each line's data reaches the app, in one place so the form, the
 * shipment page and the refresh all agree. Browser-safe: no service imports.
 */

/** Lines whose public tracking backend the server can ask itself, on save, on Refresh and every morning. */
export const autoTrackedCarriers = [
  "yang_ming",
  "cosco",
  "one",
  "arkas",
  "first_flight",
] as const satisfies readonly (Carrier & TrackingSource)[];

export type AutoTrackedCarrier = (typeof autoTrackedCarriers)[number];

/**
 * Lines whose site turns away anything but a real browser (Akamai,
 * Cloudflare, DataDome — Turkon's Cloudflare lets curl through but not a
 * server's fetch), or refuses connections from servers altogether.
 * Their data comes from the person's own browser: MSC through the F12 paste,
 * the rest once one of their answers has been seen and a reader built for it.
 */
export const browserOnlyCarriers = [
  "msc",
  "oocl",
  "cma_cgm",
  "hapag_lloyd",
  "maersk",
  "turkon",
  "m_line",
  "tarros",
] as const satisfies readonly Carrier[];

export const isAutoTrackedCarrier = (carrier: Carrier): carrier is AutoTrackedCarrier =>
  (autoTrackedCarriers as readonly Carrier[]).includes(carrier);

/** True when carrier data, rather than a person, keeps this line's status. */
export const isCarrierTracked = (carrier: Carrier): boolean =>
  isAutoTrackedCarrier(carrier) || carrier === "msc";
