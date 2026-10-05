import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReviewDetailContent } from "./review-detail-content";
import { reviewService } from "@/server/services/reviewService";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await reviewService.getReviewRequestById(id);

  if (!request) {
    notFound();
  }

  return (
    <DashboardShell>
      <ReviewDetailContent request={request} />
    </DashboardShell>
  );
}
