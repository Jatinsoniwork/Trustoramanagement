import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClientsContent } from "./clients-content";
import { clientService } from "@/server/services/clientService";

export default async function ClientsPage() {
  const clients = await clientService.getClients();

  return (
    <DashboardShell>
      <ClientsContent initialClients={clients} />
    </DashboardShell>
  );
}
