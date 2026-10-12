import { locodeInBrackets, parseSlashYmd, portNameOnly } from "@/utils";
import { CarrierSnapshot, SnapshotContainer, SnapshotEvent } from "./types";

/**
 * Yang Ming's public tracking backend — the same call its cargo tracking page
 * makes. No login and no captcha, but the page first asks
 * `Public/GetBlockStatus`, and an address that hammers it is blacklisted and
 * sent to an identity check. Keep this to a few calls per shipment per day.
 */

type YangMingRouting = {
  seq: number;
  picQlfr: string;
  placeName: string;
  dateTime: string;
  dateQlfr: string;
  berthInfo: string | null;
};

type YangMingContainer = {
  seq: number;
  ctnrNo: string;
  cnSize: string | null;
  cnType: string | null;
  moveDate: string | null;
  lastEvent: string | null;
  place: string | null;
  dportETA: string | null;
};

type YangMingResult = {
  queryTrackNo: string;
  returnTrackNo: string;
  basicInfo: {
    receipt: string | null;
    loading: string | null;
    discharge: string | null;
    delivery: string | null;
    vesselName: string | null;
    vesselComn: string | null;
    voyageCode: string | null;
    obDate: string | null;
  } | null;
  routingInfo: { routingSchedule: YangMingRouting[] | null } | null;
  containerInfo: YangMingContainer[] | null;
};

type YangMingResponse = {
  successCnt: number;
  containerList: YangMingResult[];
  blList: YangMingResult[];
  bookingList: YangMingResult[];
  blockStatus?: { isInBlackList?: boolean } | null;
};

const API_URL = "https://www.yangming.com/api/CargoTracking/GetTracking";
const PAGE_URL = "https://www.yangming.com/en/esolution/tracking/cargo_tracking";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const isYangMingResponse = (value: unknown): value is YangMingResponse =>
  typeof value === "object" &&
  value !== null &&
  "blList" in value &&
  "containerList" in value &&
  "bookingList" in value;

/** "ETA at EL DEKHEILA PORT-PUBLIC TML: 2026/10/11 23:01" → the date. */
const etaInText = (value: string | null): Date | null => {
  const match = (value ?? "").match(/(\d{4}\/\d{2}\/\d{2}(?:\s+\d{2}:\d{2})?)/);
  return match ? parseSlashYmd(match[1]) : null;
};

const routingDescription = (entry: YangMingRouting, isFirst: boolean): string => {
  if (entry.picQlfr === "DESTINATION") {
    return "Arrival at final destination";
  }
  if (isFirst) {
    return "Vessel departure";
  }
  return "Vessel arrival";
};

/** The carrier's answer turned into the app's own shape. */
export const parseYangMingResponse = (
  payload: unknown,
  requestedNumber: string,
): CarrierSnapshot => {
  if (!isYangMingResponse(payload)) {
    throw new Error("Yang Ming answered with something that is not a tracking result");
  }
  const result =
    payload.blList[0] ?? payload.bookingList[0] ?? payload.containerList[0];
  if (!result) {
    throw new Error(`Yang Ming has no record of ${requestedNumber}`);
  }

  const basic = result.basicInfo;
  const routing = result.routingInfo?.routingSchedule ?? [];
  const boxes = result.containerInfo ?? [];

  const events: SnapshotEvent[] = [];
  routing.forEach((entry, index) => {
    const occurredAt = parseSlashYmd(entry.dateTime);
    if (!occurredAt) {
      return;
    }
    events.push({
      containerNumber: null,
      occurredAt,
      isEstimated: entry.dateQlfr !== "Actual",
      description: routingDescription(entry, index === 0),
      location: entry.placeName,
      locationCode: null,
      vesselName: basic?.vesselName ?? null,
      voyage: basic?.vesselComn ?? null,
      sequence: entry.seq,
    });
    // The berth line is its own fact with its own time.
    const berthMatch = (entry.berthInfo ?? "").match(
      /(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2})\s*\((\w+)\)/,
    );
    const berthAt = berthMatch ? parseSlashYmd(berthMatch[1]) : null;
    if (berthAt) {
      events.push({
        containerNumber: null,
        occurredAt: berthAt,
        isEstimated: berthMatch?.[2] !== "Actual",
        description: "Berthed at terminal",
        location: entry.placeName,
        locationCode: null,
        vesselName: basic?.vesselName ?? null,
        voyage: basic?.vesselComn ?? null,
        sequence: entry.seq * 10 + 1,
      });
    }
  });

  const containers: SnapshotContainer[] = boxes.map((box) => ({
    containerNumber: box.ctnrNo,
    containerType: [box.cnSize ? `${box.cnSize} ft` : null, box.cnType]
      .filter(Boolean)
      .join(" "),
    isDelivered: /deliver|empty.*return/i.test(box.lastEvent ?? ""),
    latestLocation: box.place ? portNameOnly(box.place) : null,
    podEta: etaInText(box.dportETA),
  }));

  // A per-container last event is a real milestone too (e.g. "On Board").
  for (const box of boxes) {
    const movedAt = parseSlashYmd(box.moveDate);
    if (!movedAt || !box.lastEvent) {
      continue;
    }
    events.push({
      containerNumber: box.ctnrNo,
      occurredAt: movedAt,
      isEstimated: false,
      description: box.lastEvent,
      location: box.place ? portNameOnly(box.place) : "",
      locationCode: null,
      vesselName: null,
      voyage: null,
      sequence: 1000 + box.seq,
    });
  }

  const destination = routing.find((entry) => entry.picQlfr === "DESTINATION");
  const eta =
    (destination ? parseSlashYmd(destination.dateTime) : null) ??
    containers.find((box) => box.podEta)?.podEta ??
    null;

  return {
    trackingNumber: result.queryTrackNo || requestedNumber,
    alternateNumbers: [result.returnTrackNo].filter(
      (n): n is string => Boolean(n) && n !== result.queryTrackNo,
    ),
    portOfLoading: basic?.loading ?? null,
    portOfDischarge: basic?.discharge ?? null,
    placeOfDelivery: basic?.delivery ?? null,
    vesselName: basic?.vesselName ?? null,
    voyage: basic?.vesselComn ?? null,
    etd: parseSlashYmd(basic?.obDate),
    eta,
    isDelivered: containers.length > 0 && containers.every((box) => box.isDelivered),
    containers,
    events,
  };
};

/** The UN/LOCODE Yang Ming writes after a port, when it does. */
export const yangMingPortCode = (value: string | null): string | null =>
  locodeInBrackets(value);

/** Ask Yang Ming about one number. */
export const fetchYangMingTracking = async (
  trackingNumber: string,
): Promise<CarrierSnapshot> => {
  const query = new URLSearchParams({
    paramTrackNo: trackingNumber.trim().toUpperCase(),
    paramTrackPosition: "SEARCH",
    paramRefNo: "",
  });
  const response = await fetch(`${API_URL}?${query.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      Referer: PAGE_URL,
    },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Yang Ming answered ${response.status}`);
  }
  const payload: unknown = await response.json();
  if (
    typeof payload === "object" &&
    payload !== null &&
    "blockStatus" in payload &&
    typeof payload.blockStatus === "object" &&
    payload.blockStatus !== null &&
    "isInBlackList" in payload.blockStatus &&
    payload.blockStatus.isInBlackList === true
  ) {
    throw new Error(
      "Yang Ming has blocked this server's address; open the tracking page by hand for now",
    );
  }
  return parseYangMingResponse(payload, trackingNumber);
};
