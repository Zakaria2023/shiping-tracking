import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMscTrackingInfo } from "./msc";
import { deriveStatus, latestActualEvent } from "./status";
import { CarrierSnapshot } from "./types";
import { parseYangMingResponse } from "./yang-ming";

const SAMPLES = join(import.meta.dirname, "../../../docs/carrier-samples");

const readSample = (name: string): unknown =>
  JSON.parse(readFileSync(join(SAMPLES, name), "utf8"));

const yangMing = () =>
  parseYangMingResponse(
    readSample("yangming-gettracking-YMJAM209075665.json"),
    "YMJAM209075665",
  );

const msc = () => parseMscTrackingInfo(readSample("msc-trackinginfo-177TDFDFS902229.json"));

describe("Yang Ming parser", () => {
  it("reads the ports, vessel and dates", () => {
    const snapshot = yangMing();
    expect(snapshot.trackingNumber).toBe("YMJAM209075665");
    expect(snapshot.portOfLoading).toBe("KAOHSIUNG (TWKHH)");
    expect(snapshot.portOfDischarge).toBe("DAMIETTA (EGDAM)");
    expect(snapshot.vesselName).toBe("YM WISH");
    expect(snapshot.voyage).toBe("051W");
    expect(snapshot.etd).toEqual(new Date(2026, 7, 6));
    expect(snapshot.eta).toEqual(new Date(2026, 9, 11, 23, 1));
    expect(snapshot.containers).toHaveLength(5);
  });

  it("is still sailing: at the discharge port, but delivery is a feeder leg away", () => {
    const snapshot = yangMing();
    expect(deriveStatus(snapshot)).toBe("sailing");
    expect(latestActualEvent(snapshot)?.location).toMatch(/DAMIETTA/);
  });

  it("arrives once the final destination leg is actual", () => {
    const snapshot = yangMing();
    const arrived = {
      ...snapshot,
      events: snapshot.events.map((event) =>
        event.description === "Arrival at final destination" ? { ...event, isEstimated: false } : event,
      ),
    };
    expect(deriveStatus(arrived)).toBe("arrived");
  });
});

describe("MSC parser", () => {
  it("reads one snapshot per bill of lading", () => {
    const [snapshot] = msc();
    expect(snapshot?.trackingNumber).toBe("MEDUABR70013");
    expect(snapshot?.alternateNumbers).toContain("177TDFDFS902229");
    expect(snapshot?.portOfLoading).toBe("SHANGHAI, CN");
    expect(snapshot?.portOfDischarge).toBe("BEIRUT, LB");
    expect(snapshot?.eta).toEqual(new Date(2026, 10, 9));
    expect(snapshot?.etd).toEqual(new Date(2026, 8, 12));
    expect(snapshot?.vesselName).toBe("MSC BRITTANY");
    expect(snapshot?.containers).toHaveLength(2);
  });

  it("is sailing: loaded, transshipped, arrival only estimated", () => {
    const [snapshot] = msc();
    expect(snapshot && deriveStatus(snapshot)).toBe("sailing");
    expect(snapshot && latestActualEvent(snapshot)?.location).toBe("SINGAPORE, SG");
  });
});

describe("deriveStatus", () => {
  const base: CarrierSnapshot = {
    trackingNumber: "X",
    alternateNumbers: [],
    portOfLoading: "SHANGHAI, CN",
    portOfDischarge: "BEIRUT, LB",
    placeOfDelivery: null,
    vesselName: null,
    voyage: null,
    etd: null,
    eta: null,
    isDelivered: false,
    containers: [],
    events: [],
  };

  const event = (
    description: string,
    location: string,
    isEstimated = false,
  ): CarrierSnapshot["events"][number] => ({
    containerNumber: null,
    occurredAt: new Date(2026, 0, 1),
    isEstimated,
    description,
    location,
    locationCode: null,
    vesselName: null,
    voyage: null,
    sequence: 0,
  });

  it("is pending with nothing but yard events", () => {
    expect(
      deriveStatus({ ...base, events: [event("Export received at CY", "SHANGHAI, CN")] }),
    ).toBe("pending");
  });

  it("an estimated arrival is not an arrival", () => {
    expect(
      deriveStatus({
        ...base,
        events: [
          event("Export Loaded on Vessel", "SHANGHAI, CN"),
          event("Estimated Time of Arrival", "BEIRUT, LB", true),
        ],
      }),
    ).toBe("sailing");
  });

  it("a discharge at the port of discharge is not arrival when delivery is further on", () => {
    expect(
      deriveStatus({
        ...base,
        placeOfDelivery: "EL DEKHEILA PORT-PUBLIC TML (EGEDK)",
        portOfDischarge: "DAMIETTA (EGDAM)",
        events: [
          event("Vessel departure", "KAOHSIUNG"),
          event("Vessel arrival", "DAMIETTA"),
        ],
      }),
    ).toBe("sailing");
  });

  it("a real discharge at the discharge port is an arrival", () => {
    expect(
      deriveStatus({
        ...base,
        events: [
          event("Export Loaded on Vessel", "SHANGHAI, CN"),
          event("Full Import Discharged", "BEIRUT, LB"),
        ],
      }),
    ).toBe("arrived");
  });

  it("a discharge at a transshipment port is still sailing", () => {
    expect(
      deriveStatus({
        ...base,
        events: [
          event("Export Loaded on Vessel", "SHANGHAI, CN"),
          event("Full Transshipment Discharged", "SINGAPORE, SG"),
        ],
      }),
    ).toBe("sailing");
  });

  it("the carrier saying delivered wins", () => {
    expect(deriveStatus({ ...base, isDelivered: true })).toBe("delivered");
  });
});
