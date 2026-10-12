import { ArrivalsList } from "@/components/dashboard/arrivals-list";
import { CountryBreakdownTable } from "@/components/dashboard/country-breakdown-table";
import { RecentEvents } from "@/components/dashboard/recent-events";
import { StatusTiles } from "@/components/dashboard/status-tiles";
import { getDashboardData } from "@/services";

/** The data-dependent body of the dashboard, streamed inside its boundary. */
export const DashboardContent = async () => {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-5">
      <StatusTiles counts={data.statusCounts} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CountryBreakdownTable
          title="By origin country"
          description="Where shipments are loaded, and what state each is in."
          rows={data.byLoadingCountry}
          filterKey="from"
        />
        <CountryBreakdownTable
          title="By destination country"
          description="Where shipments are going."
          rows={data.byDischargeCountry}
          filterKey="to"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ArrivalsList
          title="Arriving within two weeks"
          empty="Nothing due in the next two weeks."
          shipments={data.arrivingSoon}
        />
        <ArrivalsList
          title="Past ETA, not arrived"
          empty="Nothing is overdue."
          shipments={data.overdue}
          tone="pending"
        />
        <RecentEvents events={data.recentEvents} />
      </div>
    </div>
  );
};
