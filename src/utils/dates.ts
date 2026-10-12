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

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
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
