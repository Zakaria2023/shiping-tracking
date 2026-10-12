import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const DashboardPage = () => (
  <div className="flex flex-col gap-5">
    <PageHeader
      title="Dashboard"
      description="What is moving, where it is going, and what needs a look."
    />
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <DashboardContent />
    </Suspense>
  </div>
);

export default DashboardPage;
