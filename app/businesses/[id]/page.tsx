import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BusinessDetailContent } from "./business-detail-content";
import { businessService } from "@/server/services/businessService";
import { clientService } from "@/server/services/clientService";
import { reviewService } from "@/server/services/reviewService";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await businessService.getBusinessById(id);

  if (!business) {
    notFound();
  }

  const [clients, allReviews] = await Promise.all([
    clientService.getClients(),
    reviewService.getReviewRequests({ businessId: id }),
  ]);

  return (
    <DashboardShell>
      <BusinessDetailContent
        initialBusiness={business}
        clients={clients}
        associatedReviews={allReviews}
      />
    </DashboardShell>
  );
}
