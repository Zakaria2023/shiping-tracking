import { parseDashYmd, portNameOnly, samePlace } from "@/utils";
import { CarrierSnapshot, SnapshotContainer, SnapshotEvent } from "./types";

/**
 * COSCO's public tracking backend — the calls its cargo tracking page makes.
 * No login, no captcha. A bill of lading gives the voyage legs and each box's
 * latest move; a container number on its own gives only that latest move.
 * Anonymous callers get no fuller history than that.
 */

type CoscoLeg = {
  vesselName: string | null;
  voyageNo: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  actualShippingDate: string | null;
  expectedDateOfDeparture: string | null;
  actualDepartureDate: string | null;
  estimatedDateOfArrival: string | null;
  actualArrivalDate: string | null;
  actualDischargeDate: string | null;
};

type CoscoBoxDates = {
  cntrNum: string;
  ladenPickUpDt: string | null;
  emptyReturnDt: string | null;
};

type CoscoBill = {
  isbillOfLadingExist: boolean;
  actualShipment: CoscoLeg[] | null;
  cargoTrackingContainer: CoscoBoxDates[] | null;
  trackingPath: {
    billOfladingRefCode: string | null;
    toCity: string | null;
    vslNme: string | null;
    voyNumber: string | null;
  } | null;
};

type CoscoBoxStatus = {
  containerNumber: string;
  containerType: string | null;
  label: string | null;
  location: string | null;
  locationDateTime: string | null;
};

type CoscoEnvelope<T> = { code: string; data: { content: T } | null };

const API_URL = "https://elines.coscoshipping.com/ebtracking/public";
const PAGE_URL = "https://elines.coscoshipping.com/ebusiness/cargoTracking";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const CONTAINER_PATTERN = /^[A-Z]{4}\d{7}$/;
const DELIVERED_PATTERN = /deliver|empty.*return|gate out|picked up/i;

/** "COSU6463957370" → "6463957370": the backend wants the bare number. */
export const coscoQueryNumber = (trackingNumber: string): string =>
  trackingNumber.trim().toUpperCase().replace(/^COSU(?=\d)/, "");

const contentOf = <T>(payload: unknown): T | null => {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("COSCO answered with something that is not a tracking result");
  }
  return (payload as CoscoEnvelope<T>).data?.content ?? null;
};

/** One leg's facts, each a separate event so the timeline shows them in turn. */
const legEvents = (leg: CoscoLeg, index: number): SnapshotEvent[] => {
  const base = { containerNumber: null, locationCode: null, vesselName: leg.vesselName, voyage: leg.voyageNo };
  const from = leg.portOfLoading ?? "";
  const to = leg.portOfDischarge ?? "";
  const candidates: Array<[string | null, boolean, string, string]> = [
    [leg.actualShippingDate, false, "Loaded on vessel", from],
    leg.actualDepartureDate
      ? [leg.actualDepartureDate, false, "Vessel departure", from]
      : [leg.expectedDateOfDeparture, true, "Vessel departure", from],
    leg.actualArrivalDate
      ? [leg.actualArrivalDate, false, "Vessel arrival", to]
      : [leg.estimatedDateOfArrival, true, "Vessel arrival", to],
    [leg.actualDischargeDate, false, "Discharged", to],
  ];
  return candidates.flatMap(([value, isEstimated, description, location], step) => {
    const occurredAt = parseDashYmd(value);
    return occurredAt
      ? [{ ...base, occurredAt, isEstimated, description, location, sequence: index * 10 + step }]
      : [];
  });
};

const boxEvent = (box: CoscoBoxStatus, index: number): SnapshotEvent | null => {
  const occurredAt = parseDashYmd(box.locationDateTime);
  if (!occurredAt || !box.label) {
    return null;
  }
  return {
    containerNumber: box.containerNumber,
    occurredAt,
    isEstimated: false,
    description: box.label,
    location: box.location ? portNameOnly(box.location) : "",
    locationCode: null,
    vesselName: null,
    voyage: null,
    sequence: 1000 + index,
  };
};

/** The bill of lading answer and its boxes' latest moves, in the app's shape. */
export const parseCoscoBill = (
  billPayload: unknown,
  boxesPayload: unknown,
  requestedNumber: string,
): CarrierSnapshot => {
  const bill = contentOf<CoscoBill>(billPayload);
  if (!bill?.isbillOfLadingExist) {
    throw new Error(`COSCO has no record of ${requestedNumber}`);
  }
  const legs = bill.actualShipment ?? [];
  const statuses = contentOf<CoscoBoxStatus[]>(boxesPayload) ?? [];
  const dates = new Map((bill.cargoTrackingContainer ?? []).map((box) => [box.cntrNum, box]));

  const containers: SnapshotContainer[] = statuses.map((box) => {
    const boxDates = dates.get(box.containerNumber);
    return {
      containerNumber: box.containerNumber,
      containerType: box.containerType,
      isDelivered:
        DELIVERED_PATTERN.test(box.label ?? "") ||
        Boolean(boxDates?.ladenPickUpDt || boxDates?.emptyReturnDt),
      latestLocation: box.location ? portNameOnly(box.location) : null,
      podEta: null,
    };
  });

  const events = [
    ...legs.flatMap(legEvents),
    ...statuses.map(boxEvent).filter((event): event is SnapshotEvent => event !== null),
  ];

  const first = legs[0];
  const last = legs.at(-1);
  const portOfDischarge = last?.portOfDischarge ?? null;
  const toCity = bill.trackingPath?.toCity ? portNameOnly(bill.trackingPath.toCity) : null;

  return {
    trackingNumber: requestedNumber.trim().toUpperCase(),
    alternateNumbers: [],
    portOfLoading: first?.portOfLoading ?? null,
    portOfDischarge,
    placeOfDelivery: toCity && !samePlace(toCity, portOfDischarge) ? toCity : null,
    vesselName: bill.trackingPath?.vslNme ?? first?.vesselName ?? null,
    voyage: bill.trackingPath?.voyNumber ?? first?.voyageNo ?? null,
    etd: parseDashYmd(first?.actualDepartureDate ?? first?.expectedDateOfDeparture),
    eta: parseDashYmd(last?.actualArrivalDate ?? last?.estimatedDateOfArrival),
    isDelivered: containers.length > 0 && containers.every((box) => box.isDelivered),
    containers,
    events,
  };
};

/** A container number on its own: only its latest move comes back. */
export const parseCoscoContainer = (payload: unknown, requestedNumber: string): CarrierSnapshot => {
  type Found = {
    containers: Array<{
      container: { containerNumber: string; containerType: string | null };
      containerCircleStatus: Array<{
        containerNumberStatus: string | null;
        location: string | null;
        timeOfIssue: string | null;
      }> | null;
    }> | null;
  };
  const found = contentOf<Found>(payload)?.containers?.[0];
  if (!found) {
    throw new Error(`COSCO has no record of ${requestedNumber}`);
  }
  const latest = found.containerCircleStatus?.[0];
  const box: CoscoBoxStatus = {
    containerNumber: found.container.containerNumber,
    containerType: found.container.containerType,
    label: latest?.containerNumberStatus ?? null,
    location: latest?.location ?? null,
    locationDateTime: latest?.timeOfIssue ?? null,
  };
  const event = boxEvent(box, 0);

  return {
    trackingNumber: box.containerNumber,
    alternateNumbers: [],
    portOfLoading: null,
    portOfDischarge: null,
    placeOfDelivery: null,
    vesselName: null,
    voyage: null,
    etd: null,
    eta: null,
    isDelivered: DELIVERED_PATTERN.test(box.label ?? ""),
    containers: [
      {
        containerNumber: box.containerNumber,
        containerType: box.containerType,
        isDelivered: DELIVERED_PATTERN.test(box.label ?? ""),
        latestLocation: box.location ? portNameOnly(box.location) : null,
        podEta: null,
      },
    ],
    events: event ? [event] : [],
  };
};

const getJson = async (path: string): Promise<unknown> => {
  const response = await fetch(`${API_URL}/${path}?timestamp=${Date.now()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT, Referer: PAGE_URL },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`COSCO answered ${response.status}`);
  }
  return response.json();
};

/** Ask COSCO about one bill of lading or container number. */
export const fetchCoscoTracking = async (trackingNumber: string): Promise<CarrierSnapshot> => {
  const number = coscoQueryNumber(trackingNumber);
  if (CONTAINER_PATTERN.test(number)) {
    return parseCoscoContainer(await getJson(`containers/${number}`), number);
  }
  const [bill, boxes] = await Promise.all([
    getJson(`bill/${number}`),
    getJson(`bill/containers/${number}`),
  ]);
  return parseCoscoBill(bill, boxes, trackingNumber);
};
