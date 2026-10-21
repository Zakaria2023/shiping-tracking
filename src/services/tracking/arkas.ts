import { parseDashYmd, parseLooseDate } from "@/utils";
import { CarrierSnapshot, SnapshotContainer, SnapshotEvent } from "./types";

/**
 * Arkas' public tracking backend — what its tracking page (an iframe of
 * webtrackingprodnew.arkasline.com.tr) calls. No login and no captcha. A
 * search returns one "documentation" per container; each one's moves are a
 * second call. Moves flagged `isDummy` are the planned ones still to come.
 */

type ArkasDocument = {
  documentationId: number;
  containerNo: string | null;
  size: string | null;
  type: string | null;
  lastRecordedStatus: string | null;
  lastRecordedLocation: string | null;
  finalDestination: string | null;
  bookingNo: string | null;
  blNo: string | null;
};

type ArkasMove = {
  port: string | null;
  terminal: string | null;
  status: string | null;
  date: string | null;
  eventDate: string | null;
  vesselName: string | null;
  voyageNumber: string | null;
  isDummy: boolean;
};

const API_URL = "https://webtrackingprodnew.arkasline.com.tr/api/request/Get";
const PAGE_URL = "https://webtrackingprodnew.arkasline.com.tr/shipmenttracking";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const LOADED_PATTERN = /load/i;
const DISCHARGED_PATTERN = /discharg|unload/i;
const DELIVERED_PATTERN = /deliver|empty.*return|returned empty|gate out/i;

const documentsOf = (payload: unknown): ArkasDocument[] => {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("Arkas answered with something that is not a tracking result");
  }
  const data = payload.data as { data?: unknown } | null;
  return Array.isArray(data?.data) ? (data.data as ArkasDocument[]) : [];
};

const movesOf = (payload: unknown): ArkasMove[] =>
  typeof payload === "object" && payload !== null && "data" in payload && Array.isArray(payload.data)
    ? (payload.data as ArkasMove[])
    : [];

const moveDate = (move: ArkasMove): Date | null =>
  parseDashYmd(move.eventDate) ?? parseLooseDate(move.date);

/** The documents and each one's moves, in the app's shape. */
export const parseArkasTracking = (
  documentsPayload: unknown,
  movesByDocument: Record<number, unknown>,
  requestedNumber: string,
): CarrierSnapshot => {
  const documents = documentsOf(documentsPayload);
  if (documents.length === 0) {
    throw new Error(`Arkas has no record of ${requestedNumber}`);
  }

  const events: SnapshotEvent[] = [];
  const containers: SnapshotContainer[] = [];
  const voyageMoves: Array<{ move: ArkasMove; at: Date }> = [];

  for (const document of documents) {
    const moves = movesOf(movesByDocument[document.documentationId]);
    for (const [index, move] of moves.entries()) {
      const occurredAt = moveDate(move);
      if (!occurredAt || !move.status) {
        continue;
      }
      events.push({
        containerNumber: document.containerNo,
        occurredAt,
        isEstimated: move.isDummy,
        description: move.status,
        location: move.port ?? "",
        locationCode: null,
        vesselName: move.vesselName || null,
        voyage: move.voyageNumber || null,
        sequence: index,
      });
      if (move.vesselName) {
        voyageMoves.push({ move, at: occurredAt });
      }
    }
    if (document.containerNo) {
      containers.push({
        containerNumber: document.containerNo,
        containerType: [document.size, document.type].filter(Boolean).join(" ") || null,
        isDelivered: DELIVERED_PATTERN.test(document.lastRecordedStatus ?? ""),
        latestLocation: document.lastRecordedLocation,
        podEta: null,
      });
    }
  }

  voyageMoves.sort((a, b) => a.at.getTime() - b.at.getTime());
  const loading = voyageMoves.find(({ move }) => LOADED_PATTERN.test(move.status ?? ""));
  const discharge = voyageMoves.findLast(({ move }) => DISCHARGED_PATTERN.test(move.status ?? ""));
  const sailing = discharge ?? loading;
  const first = documents[0];

  return {
    trackingNumber: first.blNo || first.bookingNo || requestedNumber.trim().toUpperCase(),
    alternateNumbers: [first.bookingNo].filter(
      (n): n is string => Boolean(n) && n !== first.blNo,
    ),
    portOfLoading: loading?.move.port ?? null,
    portOfDischarge: discharge?.move.port ?? null,
    placeOfDelivery: first.finalDestination || null,
    vesselName: sailing?.move.vesselName ?? null,
    voyage: sailing?.move.voyageNumber ?? null,
    etd: loading?.at ?? null,
    eta: discharge?.at ?? null,
    isDelivered: containers.length > 0 && containers.every((box) => box.isDelivered),
    containers,
    events,
  };
};

const call = async (controllerMethod: string, params: Record<string, unknown>): Promise<unknown> => {
  const query = new URLSearchParams({ controllerMethod, prms: JSON.stringify(params) });
  const response = await fetch(`${API_URL}?${query.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT, Referer: PAGE_URL },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Arkas answered ${response.status}`);
  }
  // The answer is JSON wrapped in a JSON string, so it is read twice.
  const body: unknown = await response.json();
  return typeof body === "string" ? JSON.parse(body) : body;
};

/** Ask Arkas about one bill of lading, booking or container number. */
export const fetchArkasTracking = async (trackingNumber: string): Promise<CarrierSnapshot> => {
  const number = trackingNumber.trim().toUpperCase();
  const documents = await call("webtracking/api/shipmenttracking/GetDocumentationAsync", { key: number });

  const moves: Record<number, unknown> = {};
  for (const document of documentsOf(documents)) {
    moves[document.documentationId] = await call(
      "webtracking/api/shipmenttracking/GetDocumentationHistoryAsync",
      { documentationId: document.documentationId },
    );
  }
  return parseArkasTracking(documents, moves, number);
};
