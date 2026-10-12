export * from "./countries";
export * from "./dates";
export * from "./carrier-links";
export * from "./text";

/** What a Server Action hands back to a form. */
export type ActionResult = {
  success?: boolean;
  error?: string;
};

/** What a searched, paginated list is asked for. All optional: they come off the URL. */
export type ListParams = {
  search?: string;
  page?: number | string;
  pageSize?: number | string;
};

/** A page of results plus what a list UI needs to paginate. */
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const generateUuid = (): string => crypto.randomUUID();

/**
 * Turn a thrown value into the `{ error }` a form shows. A real Error keeps
 * its message, since services throw sentences meant for people; anything
 * else gets the fallback.
 */
export const fail = (error: unknown, fallback: string): { error: string } => {
  console.error(fallback, error);
  if (error instanceof Error && error.message) {
    return { error: error.message };
  }
  return { error: fallback };
};

const toPositiveInt = (value: number | string | undefined, fallback: number) => {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (parsed === undefined || Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

/** The page window a list query reads, from whatever the URL said. */
export const resolvePagination = (
  page?: number | string,
  pageSize?: number | string,
): { page: number; pageSize: number; offset: number } => {
  const resolvedPage = toPositiveInt(page, 1);
  const resolvedPageSize = Math.min(
    toPositiveInt(pageSize, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  return {
    page: resolvedPage,
    pageSize: resolvedPageSize,
    offset: (resolvedPage - 1) * resolvedPageSize,
  };
};

export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
