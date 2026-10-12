import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { RefreshAllButton } from "@/components/shipments/refresh-all-button";
import { ShipmentFilters } from "@/components/shipments/shipment-filters";
import { ShipmentsList } from "@/components/shipments/shipments-list";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { parseShipmentFilters } from "@/lib/shipment-filters";
import { getCountriesInUse } from "@/services";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ShipmentsPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const filters = parseShipmentFilters(params);
  const [loadingCountries, dischargeCountries] = await Promise.all([
    getCountriesInUse("loading"),
    getCountriesInUse("discharge"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Shipments"
        description="Every shipment, filtered by where it comes from, where it goes and where it stands."
        actions={
          <>
            <RefreshAllButton />
            <Link
              href="/shipments/new"
              className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus size={16} />
              New shipment
            </Link>
          </>
        }
      />

      <Suspense>
        <ShipmentFilters
          loadingCountries={loadingCountries}
          dischargeCountries={dischargeCountries}
        />
      </Suspense>

      <Suspense key={JSON.stringify(filters)} fallback={<TableSkeleton />}>
        <ShipmentsList filters={filters} />
      </Suspense>
    </div>
  );
};

export default ShipmentsPage;
