import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BusinessesContent } from "./businesses-content";
import { businessService } from "@/server/services/businessService";
import { clientService } from "@/server/services/clientService";

export default async function BusinessesPage() {
  const [businesses, clients] = await Promise.all([
    businessService.getBusinesses(),
    clientService.getClients(),
  ]);

  return (
    <DashboardShell>
      <BusinessesContent initialBusinesses={businesses} clients={clients} />
    </DashboardShell>
  );
}
