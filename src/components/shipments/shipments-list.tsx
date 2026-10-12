import Link from "next/link";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getShipmentsPage, ShipmentFilters } from "@/services";

type ShipmentsListProps = {
  filters: ShipmentFilters;
};

/** The filter-dependent part of the list page, streamed inside its boundary. */
export const ShipmentsList = async ({ filters }: ShipmentsListProps) => {
  const result = await getShipmentsPage(filters);

  if (result.total === 0) {
    const filtered = Boolean(
      filters.search ||
        filters.status ||
        filters.carrier ||
        filters.kind ||
        filters.loadingCountry ||
        filters.dischargeCountry,
    );
    return (
      <EmptyState
        title={filtered ? "No shipments match these filters" : "No shipments yet"}
        description={
          filtered
            ? "Try clearing a filter."
            : "Add the first one from the booking details, and tracking takes it from there."
        }
        action={
          filtered ? null : (
            <Link href="/shipments/new" className="text-sm text-primary hover:underline">
              Add a shipment
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ShipmentsTable shipments={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} />
    </div>
  );
};
