import { parseDashYmd } from "@/utils";
import { CarrierSnapshot, SnapshotContainer, SnapshotEvent } from "./types";

/**
 * ONE's public tracking backend — the calls its cargo tracking page makes.
 * No login and no captcha. A search lists the containers on a booking (or the
 * one container searched for); each container's full history is a second call.
 */

type OnePlace = { code: string | null; locationName: string | null } | null;

type OneSearchRow = {
  bookingNo: string | null;
  containerNo: string;
  containerTypeSize: string | null;
  por: OnePlace;
  pod: OnePlace;
  latestEvent: { eventName: string | null; locationName: string | null } | null;
  vesselVoyage: { vesselName: string | null; voyageNo: string | null; directionCode: string | null } | null;
};

type OneEvent = {
  eventName: string;
  eventLocalPortDate: string | null;
  triggerType: string | null;
  matrixId: string | null;
  copSequence: number | null;
  location: OnePlace;
  edhVessel?: { name: string | null; voyNo: string | null } | null;
};

const API_URL = "https://ecomm.one-line.com/api/v2/edh/containers/track-and-trace";
const ORIGIN = "https://www.one-line.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const CONTAINER_PATTERN = /^[A-Z]{4}\d{7}$/;
// ONE's event codes: loaded at the port of loading, gate out to the
// consignee, and the empty box back.
const LOADED_AT_POL = "E058";
const DELIVERED_CODES = new Set(["E106", "E138"]);

/** "ONEYSELG21919400" → "SELG21919400": a ONE bill of lading is its booking with the SCAC in front. */
export const oneQueryNumber = (trackingNumber: string): string =>
  trackingNumber.trim().toUpperCase().replace(/^ONEY(?=[A-Z0-9]{8,})/, "");

const rowsOf = (payload: unknown): OneSearchRow[] => {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("ONE answered with something that is not a tracking result");
  }
  return Array.isArray(payload.data) ? (payload.data as OneSearchRow[]) : [];
};

const eventsOf = (payload: unknown): OneEvent[] =>
  typeof payload === "object" && payload !== null && "data" in payload && Array.isArray(payload.data)
    ? (payload.data as OneEvent[])
    : [];

/** ONE writes the port's own clock time with a "Z" it does not mean; read it as wall-clock time. */
const localDate = (value: string | null): Date | null => parseDashYmd(value);

const voyageOf = (row: OneSearchRow): string | null =>
  row.vesselVoyage?.voyageNo
    ? `${row.vesselVoyage.voyageNo}${row.vesselVoyage.directionCode ?? ""}`
    : null;

/** The search rows and each container's history, in the app's shape. */
export const parseOneTracking = (
  searchPayload: unknown,
  historyByContainer: Record<string, unknown>,
  requestedNumber: string,
): CarrierSnapshot => {
  const rows = rowsOf(searchPayload);
  if (rows.length === 0) {
    throw new Error(`ONE has no record of ${requestedNumber}`);
  }

  const events: SnapshotEvent[] = [];
  const containers: SnapshotContainer[] = [];
  let loadedAt: string | null = null;
  let firstDeparture: Date | null = null;
  let arrival: { at: Date; isEstimated: boolean } | null = null;

  for (const row of rows) {
    const history = eventsOf(historyByContainer[row.containerNo]);
    let delivered = false;
    for (const [index, event] of history.entries()) {
      const occurredAt = localDate(event.eventLocalPortDate);
      if (!occurredAt) {
        continue;
      }
      const isEstimated = event.triggerType !== "ACTUAL";
      const location = event.location?.locationName ?? "";
      events.push({
        containerNumber: row.containerNo,
        occurredAt,
        isEstimated,
        description: event.eventName,
        location,
        locationCode: event.location?.code ?? null,
        vesselName: event.edhVessel?.name ?? null,
        voyage: event.edhVessel?.voyNo ?? null,
        sequence: event.copSequence ?? index,
      });
      if (event.matrixId === LOADED_AT_POL) {
        loadedAt ??= location;
      }
      if (/departure from port of loading/i.test(event.eventName)) {
        firstDeparture ??= occurredAt;
      }
      if (/arrival at port of discharge/i.test(event.eventName)) {
        arrival = { at: occurredAt, isEstimated };
      }
      if (!isEstimated && event.matrixId && DELIVERED_CODES.has(event.matrixId)) {
        delivered = true;
      }
    }
    containers.push({
      containerNumber: row.containerNo,
      containerType: row.containerTypeSize,
      isDelivered: delivered,
      latestLocation: row.latestEvent?.locationName ?? null,
      podEta: arrival?.isEstimated ? arrival.at : null,
    });
  }

  const first = rows[0];
  return {
    trackingNumber: first.bookingNo ?? requestedNumber.trim().toUpperCase(),
    alternateNumbers: [],
    portOfLoading: loadedAt ?? first.por?.locationName ?? null,
    portOfDischarge: first.pod?.locationName ?? null,
    placeOfDelivery: null,
    vesselName: first.vesselVoyage?.vesselName ?? null,
    voyage: voyageOf(first),
    etd: firstDeparture,
    eta: arrival?.at ?? null,
    isDelivered: containers.length > 0 && containers.every((box) => box.isDelivered),
    containers,
    events,
  };
};

const request = async (url: string, init: RequestInit = {}): Promise<unknown> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      Origin: ORIGIN,
      Referer: `${ORIGIN}/`,
    },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`ONE answered ${response.status}`);
  }
  return response.json();
};

/** Ask ONE about one booking, bill of lading or container number. */
export const fetchOneTracking = async (trackingNumber: string): Promise<CarrierSnapshot> => {
  const number = oneQueryNumber(trackingNumber);
  const search = await request(`${API_URL}/search`, {
    method: "POST",
    body: JSON.stringify({
      page: 1,
      page_length: 20,
      filters: { search_text: number, search_type: CONTAINER_PATTERN.test(number) ? "CNTR_NO" : "BKG_NO" },
    }),
  });

  const histories: Record<string, unknown> = {};
  for (const row of rowsOf(search)) {
    const query = new URLSearchParams({ booking_no: row.bookingNo ?? number, container_no: row.containerNo });
    histories[row.containerNo] = await request(`${API_URL}/cop-events?${query.toString()}`);
  }
  return parseOneTracking(search, histories, number);
};
