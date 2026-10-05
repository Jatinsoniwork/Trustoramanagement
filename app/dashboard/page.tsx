import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardContent } from "./dashboard-content";
import { clientService } from "@/server/services/clientService";
import { businessService } from "@/server/services/businessService";
import { googleAccountService } from "@/server/services/googleAccountService";
import { reviewService } from "@/server/services/reviewService";
import { activityService } from "@/server/services/activityService";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [clients, businesses, accounts, reviews, activity] = await Promise.all([
    clientService.getClients(),
    businessService.getBusinesses(),
    googleAccountService.getAccounts(),
    reviewService.getReviewRequests(),
    activityService.getRecentActivity(10),
  ]);

  return (
    <DashboardShell>
      <DashboardContent
        initialClients={clients}
        initialBusinesses={businesses}
        initialAccounts={accounts}
        initialReviews={reviews}
        initialActivity={activity}
      />
    </DashboardShell>
  );
}
