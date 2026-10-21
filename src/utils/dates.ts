/**
 * Carrier timestamps are wall-clock times at the port, with no zone. They are
 * built as local Dates and stored as-is, so what the carrier shows is what the
 * app shows.
 */

/** "2026/08/05 23:25" or "2026/08/06" (Yang Ming). */
export const parseSlashYmd = (value: string | null | undefined): Date | null => {
  const match = (value ?? "").trim().match(
    /^(\d{4})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}))?$/,
  );
  if (!match) {
    return null;
  }
  const [, y, m, d, hh, mm] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh ?? 0),
    Number(mm ?? 0),
  );
};

/** "2026-10-20 17:18", "2026-10-20T17:18:00" or "2026-10-20" (COSCO and most JSON backends). */
export const parseDashYmd = (value: string | null | undefined): Date | null => {
  const match = (value ?? "").trim().match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/,
  );
  if (!match) {
    return null;
  }
  const [, y, m, d, hh, mm] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh ?? 0),
    Number(mm ?? 0),
  );
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * A carrier date whose format is not pinned down: year first with any
 * separator, or day first ("21/10/2026", "21.10.2026", "21-Oct-2026",
 * "21 Oct 2026"), optionally followed by a time — or with the time given
 * apart. Day first, never month first: no line this app reads writes US dates.
 */
export const parseLooseDate = (
  value: string | null | undefined,
  time?: string | null,
): Date | null => {
  const text = `${(value ?? "").trim()} ${(time ?? "").trim()}`.trim();
  const clock = text.match(/(\d{1,2}):(\d{2})/);
  const [hh, mm] = clock ? [Number(clock[1]), Number(clock[2])] : [0, 0];
  const build = (y: number, m: number, d: number): Date | null =>
    m >= 1 && m <= 12 && d >= 1 && d <= 31 ? new Date(y, m - 1, d, hh, mm) : null;

  const yearFirst = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (yearFirst) {
    return build(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));
  }
  const dayFirst = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dayFirst) {
    return build(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]));
  }
  const named = text.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s,]+(\d{4})/);
  if (named) {
    const month = MONTHS.indexOf(named[2].toLowerCase()) + 1;
    return month ? build(Number(named[3]), month, Number(named[1])) : null;
  }
  return null;
};

/** "09/11/2026" or "09/11/2026 00:00" (MSC, day first). */
export const parseSlashDmy = (value: string | null | undefined): Date | null => {
  const match = (value ?? "").trim().match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/,
  );
  if (!match) {
    return null;
  }
  const [, d, m, y, hh, mm] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh ?? 0),
    Number(mm ?? 0),
  );
};

/** "2026-10-27" from an <input type="date">. */
export const parseIsoDate = (value: string | null | undefined): Date | null => {
  const match = (value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const pad = (n: number) => String(n).padStart(2, "0");

/** The value an <input type="date"> wants. */
export const toIsoDate = (value: Date | null | undefined): string =>
  value
    ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    : "";

/** "27/10/2026" as typed into a date field (also 27-10-2026 or 27.10.2026), as "2026-10-27". "" when it is not a real date. */
export const dmyToIsoDate = (value: string): string => {
  const match = value.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!match) {
    return "";
  }
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.getDate() === Number(d) && date.getMonth() === Number(m) - 1 ? toIsoDate(date) : "";
};

/** "2026-10-27" as "27/10/2026", the way a date field shows it. */
export const isoDateToDmy = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
};

const DATE_FORMAT =new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (value: Date | null | undefined): string =>
  value ? DATE_FORMAT.format(value) : "";

export const formatDateTime = (value: Date | null | undefined): string =>
  value ? DATE_TIME_FORMAT.format(value) : "";

/** "in 12 days", "3 days ago", "today". */
export const relativeDays = (value: Date | null | undefined, now = new Date()): string => {
  if (!value) {
    return "";
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const days = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  if (days === 0) {
    return "today";
  }
  if (days === 1) {
    return "tomorrow";
  }
  if (days === -1) {
    return "yesterday";
  }
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};
