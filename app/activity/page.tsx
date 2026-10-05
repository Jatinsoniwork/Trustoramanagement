import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ActivityContent } from "./activity-content";
import { activityService } from "@/server/services/activityService";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const logs = await activityService.getAllLogs({ limit: 100 });

  return (
    <DashboardShell>
      <ActivityContent initialLogs={logs} />
    </DashboardShell>
  );
}
