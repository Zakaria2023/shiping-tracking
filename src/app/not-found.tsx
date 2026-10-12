import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

const NotFoundPage = () => (
  <EmptyState
    title="Nothing here"
    description="That shipment may have been deleted, or the link is wrong."
    action={
      <Link href="/shipments" className="text-sm text-primary hover:underline">
        Back to shipments
      </Link>
    }
  />
);

export default NotFoundPage;
