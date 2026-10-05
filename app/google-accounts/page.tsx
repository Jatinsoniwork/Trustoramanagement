import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GoogleAccountsContent } from "./google-accounts-content";
import { googleAccountService } from "@/server/services/googleAccountService";
import { LoadingState } from "@/components/ui/loading-state";

export const dynamic = "force-dynamic";

export default async function GoogleAccountsPage() {
  const [accounts, oauthStatus] = await Promise.all([
    googleAccountService.getAccounts(),
    googleAccountService.getOAuthIntegrationStatus(),
  ]);

  return (
    <DashboardShell>
      <Suspense fallback={<LoadingState message="Loading Google accounts..." />}>
        <GoogleAccountsContent
          initialAccounts={accounts}
          isOAuthConfigured={oauthStatus.configured}
        />
      </Suspense>
    </DashboardShell>
  );
}
