import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { oneQueryNumber, parseOneTracking } from "./one";
import { deriveStatus } from "./status";

const SAMPLES = join(import.meta.dirname, "../../../docs/carrier-samples");

const readSample = (name: string): unknown =>
  JSON.parse(readFileSync(join(SAMPLES, name), "utf8"));

const one = () =>
  parseOneTracking(
    readSample("one-SELG21919400.json"),
    { TRHU6300386: readSample("one-SELG21919400-cop-events-TRHU6300386.json") },
    "SELG21919400",
  );

describe("ONE parser", () => {
  it("drops the ONEY prefix of a bill of lading", () => {
    expect(oneQueryNumber("oneySELG21919400")).toBe("SELG21919400");
    expect(oneQueryNumber("TRHU6300386")).toBe("TRHU6300386");
  });

  it("reads the ports, vessel and dates in port time", () => {
    const snapshot = one();
    expect(snapshot.portOfLoading).toBe("PUSAN");
    expect(snapshot.portOfDischarge).toBe("MERSIN");
    expect(snapshot.vesselName).toBe("MSC JADE");
    expect(snapshot.voyage).toBe("0606W");
    expect(snapshot.etd).toEqual(new Date(2026, 1, 22, 0, 20));
    expect(snapshot.eta).toEqual(new Date(2026, 3, 30, 14, 30));
    expect(snapshot.events).toHaveLength(8);
  });

  it("is delivered: the empty box is back", () => {
    const snapshot = one();
    expect(snapshot.isDelivered).toBe(true);
    expect(deriveStatus(snapshot)).toBe("delivered");
  });
});
