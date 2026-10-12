import { parseSlashDmy } from "@/utils";
import { CarrierSnapshot, SnapshotContainer, SnapshotEvent } from "./types";

/**
 * MSC's tracking page is behind bot protection, so the server never calls it.
 * A real browser (the extension, or a person pasting) hands us the JSON the
 * page received from `api/feature/tools/TrackingInfo`, and this turns it into
 * the app's shape. One response can cover several bills of lading.
 */

type MscEvent = {
  Order: number;
  Date: string;
  Location: string;
  UnLocationCode: string | null;
  Description: string;
  Detail: string[] | null;
};

type MscContainer = {
  Events: MscEvent[] | null;
  Delivered: boolean;
  ContainerNumber: string;
  PodEtaDate: string | null;
  ContainerType: string | null;
  LatestMove: string | null;
};

type MscBillOfLading = {
  BillOfLadingNumber: string;
  NumberOfContainers: number;
  GeneralTrackingInfo: {
    ShippedFrom: string | null;
    ShippedTo: string | null;
    PortOfLoad: string | null;
    PortOfDischarge: string | null;
    FinalPodEtaDate: string | null;
  } | null;
  ContainersInfo: MscContainer[] | null;
  Delivered: boolean;
};

type MscTrackingInfo = {
  IsSuccess: boolean;
  Data: {
    TrackingNumber: string;
    BillOfLadings: MscBillOfLading[] | null;
  } | null;
};

const isMscTrackingInfo = (value: unknown): value is MscTrackingInfo =>
  typeof value === "object" &&
  value !== null &&
  "IsSuccess" in value &&
  "Data" in value;

const LOADED_PATTERN = /loaded on vessel/i;

const vesselInDetail = (detail: string[] | null): { vessel: string | null; voyage: string | null } => {
  if (!detail || detail.length < 2) {
    return { vessel: null, voyage: null };
  }
  return { vessel: detail[0] ?? null, voyage: detail[1] ?? null };
};

const containerEvents = (box: MscContainer): SnapshotEvent[] =>
  (box.Events ?? []).flatMap((event) => {
    const occurredAt = parseSlashDmy(event.Date);
    if (!occurredAt) {
      return [];
    }
    const { vessel, voyage } = vesselInDetail(event.Detail);
    return [
      {
        containerNumber: box.ContainerNumber,
        occurredAt,
        isEstimated: /estimated|intended/i.test(event.Description),
        description: event.Description,
        location: event.Location,
        locationCode: event.UnLocationCode || null,
        vesselName: vessel,
        voyage,
        sequence: event.Order,
      },
    ];
  });

/** One snapshot per bill of lading in the answer. */
export const parseMscTrackingInfo = (payload: unknown): CarrierSnapshot[] => {
  if (!isMscTrackingInfo(payload)) {
    throw new Error("That is not an MSC tracking result");
  }
  if (!payload.IsSuccess || !payload.Data) {
    throw new Error("MSC reported no result for that number");
  }
  const searched = payload.Data.TrackingNumber;
  const bills = payload.Data.BillOfLadings ?? [];
  if (bills.length === 0) {
    throw new Error(`MSC has no bill of lading for ${searched}`);
  }

  return bills.map((bill) => {
    const boxes = bill.ContainersInfo ?? [];
    const events = boxes.flatMap(containerEvents);
    const containers: SnapshotContainer[] = boxes.map((box) => ({
      containerNumber: box.ContainerNumber,
      containerType: box.ContainerType,
      isDelivered: box.Delivered,
      latestLocation: box.LatestMove,
      podEta: parseSlashDmy(box.PodEtaDate),
    }));

    // Loading is per container; the shipment's departure is the first box out.
    const loadedDates = events
      .filter((event) => LOADED_PATTERN.test(event.description) && !event.isEstimated)
      .map((event) => event.occurredAt.getTime());
    const etd = loadedDates.length > 0 ? new Date(Math.min(...loadedDates)) : null;

    const lastLoaded = events
      .filter((event) => LOADED_PATTERN.test(event.description))
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
    const arrival = events.find((event) => /estimated time of arrival/i.test(event.description));

    const alternateNumbers = [searched, ...boxes.map((box) => box.ContainerNumber)].filter(
      (n) => n && n !== bill.BillOfLadingNumber,
    );

    return {
      trackingNumber: bill.BillOfLadingNumber,
      alternateNumbers,
      portOfLoading: bill.GeneralTrackingInfo?.PortOfLoad ?? null,
      portOfDischarge: bill.GeneralTrackingInfo?.PortOfDischarge ?? null,
      placeOfDelivery: bill.GeneralTrackingInfo?.ShippedTo ?? null,
      vesselName: arrival?.vesselName ?? lastLoaded?.vesselName ?? null,
      voyage: arrival?.voyage ?? lastLoaded?.voyage ?? null,
      etd,
      eta: parseSlashDmy(bill.GeneralTrackingInfo?.FinalPodEtaDate),
      isDelivered: bill.Delivered || (boxes.length > 0 && boxes.every((box) => box.Delivered)),
      containers,
      events,
    };
  });
};
