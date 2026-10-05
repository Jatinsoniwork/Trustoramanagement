import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NewReviewContent } from "./new-review-content";
import { businessService } from "@/server/services/businessService";
import { googleAccountService } from "@/server/services/googleAccountService";

export default async function NewReviewRequestPage() {
  const [businesses, googleAccounts] = await Promise.all([
    businessService.getBusinesses(),
    googleAccountService.getAccounts(),
  ]);

  return (
    <DashboardShell>
      <NewReviewContent
        businesses={businesses}
        googleAccounts={googleAccounts}
      />
    </DashboardShell>
  );
}
