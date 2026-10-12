import { ShipmentForm } from "@/components/shipments/shipment-form";
import { PageHeader } from "@/components/ui/page-header";

const NewShipmentPage = () => (
  <div className="flex flex-col gap-5">
    <PageHeader
      title="New shipment"
      description="The facts from the booking. Tracking fills in the rest."
    />
    <ShipmentForm mode="add" />
  </div>
);

export default NewShipmentPage;
