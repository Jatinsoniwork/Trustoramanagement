import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClientDetailContent } from "./client-detail-content";
import { clientService } from "@/server/services/clientService";
import { businessService } from "@/server/services/businessService";
import { reviewService } from "@/server/services/reviewService";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await clientService.getClientById(id);

  if (!client) {
    notFound();
  }

  const [businesses, allReviews] = await Promise.all([
    businessService.getBusinesses({ clientId: id }),
    reviewService.getReviewRequests(),
  ]);

  const clientReviews = allReviews.filter(
    (r) => r.business?.clientId === id || businesses.some((b) => b.id === r.businessId)
  );

  return (
    <DashboardShell>
      <ClientDetailContent
        initialClient={client}
        associatedBusinesses={businesses}
        associatedReviews={clientReviews}
      />
    </DashboardShell>
  );
}
