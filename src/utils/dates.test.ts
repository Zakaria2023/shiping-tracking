import { describe, expect, it } from "vitest";
import { dmyToIsoDate, isoDateToDmy } from "./dates";

describe("day-first date fields", () => {
  it("reads the day before the month", () => {
    expect(dmyToIsoDate("05/11/2026")).toBe("2026-11-05");
    expect(dmyToIsoDate("5.11.2026")).toBe("2026-11-05");
  });

  it("rejects text that is not a real date", () => {
    expect(dmyToIsoDate("31/02/2026")).toBe("");
    expect(dmyToIsoDate("11/2026")).toBe("");
    expect(dmyToIsoDate("")).toBe("");
  });

  it("shows a stored date day first", () => {
    expect(isoDateToDmy("2026-11-05")).toBe("05/11/2026");
    expect(isoDateToDmy("")).toBe("");
  });
});
