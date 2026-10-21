import { parseLooseDate } from "@/utils";
import { CarrierSnapshot, SnapshotEvent } from "./types";

/**
 * First Flight, a courier in the Gulf — for the papers (original bills of
 * lading and the like) sent apart from the cargo. Its tracking page calls a
 * public backend with no login or captcha. Built from the page's code, not
 * yet from a real air waybill: the date format is the one open question, so
 * the dates are read loosely.
 */

type FirstFlightLog = {
  ActivityDate: string | null;
  ActivityTime: string | null;
  Status: string | null;
  Location: string | null;
  Remarks: string | null;
  DeliveredTo: string | null;
};

type FirstFlightBill = {
  AirWayBillNo: string | null;
  Origin: string | null;
  Destination: string | null;
  ForwardingNumber: string | null;
  ShipperReference: string | null;
  TrackingLogDetails: FirstFlightLog[] | null;
};

const API_URL = "https://webapi.firstflightme.com/api/user/track-by-awb";
const PAGE_URL = "https://firstflightme.com/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const DELIVERED_STATUSES = new Set(["POD", "DELIVERED"]);

const statusOf = (log: FirstFlightLog): string => (log.Status ?? "").trim().toUpperCase();

const describe = (log: FirstFlightLog): string => {
  if (DELIVERED_STATUSES.has(statusOf(log))) {
    return log.DeliveredTo ? `Delivered to consignee (${log.DeliveredTo})` : "Delivered to consignee";
  }
  if (statusOf(log) === "RTO") {
    return log.DeliveredTo ? `Returned to ${log.DeliveredTo}` : "Returned to sender";
  }
  return log.Remarks?.trim() || log.Status?.trim() || "Update";
};

/** The courier's answer for one air waybill, in the app's shape. */
export const parseFirstFlightResponse = (payload: unknown, requestedNumber: string): CarrierSnapshot => {
  if (typeof payload !== "object" || payload === null || !("AirwayBillTrackList" in payload)) {
    throw new Error("First Flight answered with something that is not a tracking result");
  }
  const bills = Array.isArray(payload.AirwayBillTrackList)
    ? (payload.AirwayBillTrackList as FirstFlightBill[])
    : [];
  // An unknown number still comes back as an entry: the number echoed, every other field empty.
  const bill = bills.find(
    (entry) => entry.AirWayBillNo && (entry.Origin || entry.TrackingLogDetails?.length),
  );
  if (!bill) {
    throw new Error(`First Flight has no record of ${requestedNumber}`);
  }

  // Newest first, as the page lists them.
  const logs = bill.TrackingLogDetails ?? [];
  const events: SnapshotEvent[] = logs.flatMap((log, index) => {
    const occurredAt = parseLooseDate(log.ActivityDate, log.ActivityTime);
    return occurredAt
      ? [
          {
            containerNumber: null,
            occurredAt,
            isEstimated: false,
            description: describe(log),
            location: log.Location?.trim() ?? "",
            locationCode: null,
            vesselName: null,
            voyage: null,
            sequence: logs.length - index,
          },
        ]
      : [];
  });

  return {
    trackingNumber: bill.AirWayBillNo ?? requestedNumber,
    alternateNumbers: [bill.ForwardingNumber, bill.ShipperReference].filter(
      (n): n is string => Boolean(n?.trim()),
    ),
    portOfLoading: bill.Origin,
    portOfDischarge: bill.Destination,
    placeOfDelivery: null,
    vesselName: null,
    voyage: null,
    etd: null,
    eta: null,
    isDelivered: logs.some((log) => DELIVERED_STATUSES.has(statusOf(log))),
    containers: [],
    events,
  };
};

/** Ask First Flight about one air waybill. */
export const fetchFirstFlightTracking = async (trackingNumber: string): Promise<CarrierSnapshot> => {
  const number = trackingNumber.trim().toUpperCase();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      Origin: PAGE_URL.slice(0, -1),
      Referer: PAGE_URL,
    },
    body: JSON.stringify({ number }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`First Flight answered ${response.status}`);
  }
  return parseFirstFlightResponse(await response.json(), number);
};
