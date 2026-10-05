import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReviewRequestsContent } from "./review-requests-content";
import { reviewService } from "@/server/services/reviewService";

export default async function ReviewRequestsPage() {
  const requests = await reviewService.getReviewRequests();

  return (
    <DashboardShell>
      <ReviewRequestsContent initialRequests={requests} />
    </DashboardShell>
  );
}
