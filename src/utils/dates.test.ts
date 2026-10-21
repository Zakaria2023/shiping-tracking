import { describe, expect, it } from "vitest";
import { dmyToIsoDate, isoDateToDmy, parseLooseDate } from "./dates";

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

describe("carrier dates of no fixed format", () => {
  it("reads year-first, day-first and named months alike", () => {
    expect(parseLooseDate("2026-10-21T14:30:00Z")).toEqual(new Date(2026, 9, 21, 14, 30));
    expect(parseLooseDate("21.10.2026 14:30")).toEqual(new Date(2026, 9, 21, 14, 30));
    expect(parseLooseDate("21/10/2026", "14:30")).toEqual(new Date(2026, 9, 21, 14, 30));
    expect(parseLooseDate("21-Oct-2026")).toEqual(new Date(2026, 9, 21));
  });

  it("gives up on text that is not a date", () => {
    expect(parseLooseDate("Pending")).toBeNull();
    expect(parseLooseDate("10/21/2026")).toBeNull();
  });
});
