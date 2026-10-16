import { notFound } from "next/navigation";
import { DeleteShipmentButton } from "@/components/shipments/delete-shipment-button";
import { ShipmentForm } from "@/components/shipments/shipment-form";
import { FormError } from "@/components/ui/form-error";
import { PageHeader } from "@/components/ui/page-header";
import { shipmentTitle } from "@/lib/shipment-display";
import { getShipment } from "@/services";

type Props = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ documents?: string }>;
};

const EditShipmentPage = async ({ params, searchParams }: Props) => {
  const { uuid } = await params;
  const { documents } = await searchParams;
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
      {documents === "failed" && (
        <FormError message="The shipment was created, but some documents did not upload. Add them again below and save." />
      )}
      <ShipmentForm mode="edit" shipment={detail.shipment} documents={detail.documents} />
    </div>
  );
};

export default EditShipmentPage;
