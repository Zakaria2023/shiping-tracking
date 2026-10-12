import { notFound } from "next/navigation";
import { DeleteShipmentButton } from "@/components/shipments/delete-shipment-button";
import { ShipmentForm } from "@/components/shipments/shipment-form";
import { PageHeader } from "@/components/ui/page-header";
import { shipmentTitle } from "@/lib/shipment-display";
import { getShipment } from "@/services";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditShipmentPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const detail = await getShipment(uuid);
  if (!detail) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`Edit ${shipmentTitle(detail.shipment)}`}
        actions={<DeleteShipmentButton uuid={uuid} />}
      />
      <ShipmentForm mode="edit" shipment={detail.shipment} />
    </div>
  );
};

export default EditShipmentPage;
