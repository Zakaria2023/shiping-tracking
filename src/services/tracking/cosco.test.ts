import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { coscoQueryNumber, parseCoscoBill } from "./cosco";
import { deriveStatus, latestActualEvent } from "./status";

const SAMPLES = join(import.meta.dirname, "../../../docs/carrier-samples");

const sample = JSON.parse(
  readFileSync(join(SAMPLES, "cosco-COSU6463957370.json"), "utf8"),
) as { bill: unknown; containers: unknown };

const cosco = () => parseCoscoBill(sample.bill, sample.containers, "COSU6463957370");

describe("COSCO parser", () => {
  it("asks the backend for the number without the COSU prefix", () => {
    expect(coscoQueryNumber("cosu6463957370")).toBe("6463957370");
    expect(coscoQueryNumber("OOCU0485448")).toBe("OOCU0485448");
  });

  it("reads the ports, vessel and dates", () => {
    const snapshot = cosco();
    expect(snapshot.portOfLoading).toBe("Nansha");
    expect(snapshot.portOfDischarge).toBe("Mersin");
    expect(snapshot.placeOfDelivery).toBeNull();
    expect(snapshot.vesselName).toBe("COSCO SHIPPING ROSE");
    expect(snapshot.voyage).toBe("047W");
    expect(snapshot.etd).toEqual(new Date(2026, 8, 25, 21, 11));
    expect(snapshot.eta).toEqual(new Date(2026, 9, 20, 7, 21));
    expect(snapshot.containers).toHaveLength(1);
  });

  it("has arrived: discharged at Mersin, not yet picked up", () => {
    const snapshot = cosco();
    expect(deriveStatus(snapshot)).toBe("arrived");
    expect(latestActualEvent(snapshot)?.description).toMatch(/Discharged/);
  });
});
