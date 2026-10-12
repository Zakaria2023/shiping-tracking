import { carriers, shipmentKinds, shipmentStatuses } from "@/db/enum";
import { ShipmentFilters } from "@/services/shipments";

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const oneOf = <T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined => (value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined);

/** The URL's search params, as the typed filters the list service takes. */
export const parseShipmentFilters = (params: RawParams): ShipmentFilters => {
  const country = (value: string | undefined) =>
    value && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : undefined;
  return {
    search: first(params.search) || undefined,
    page: first(params.page),
    status: oneOf(first(params.status), shipmentStatuses),
    carrier: oneOf(first(params.carrier), carriers),
    kind: oneOf(first(params.kind), shipmentKinds),
    loadingCountry: country(first(params.from)),
    dischargeCountry: country(first(params.to)),
  };
};
