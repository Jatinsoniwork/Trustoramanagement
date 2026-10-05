import { redirect } from "next/navigation";
import { getAdminServerSession } from "@/lib/security/auth";
import { analyticsService } from "@/server/services/analyticsService";
import { businessService } from "@/server/services/businessService";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminServerSession();
  if (!session.isAuthenticated || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const [analytics, reviews, activity, businesses] = await Promise.all([
    analyticsService.getAnalytics({ dateRange: "all" }),
    analyticsService.getReviews({ page: 1, limit: 10, dateRange: "all" }),
    analyticsService.getActivity({ limit: 15 }),
    businessService.getBusinesses(),
  ]);

  return (
    <DashboardShell>
      <AdminDashboardView
        initialAnalytics={analytics}
        initialReviews={reviews}
        initialActivity={activity}
        businesses={businesses}
        adminUser={session.user || undefined}
      />
    </DashboardShell>
  );
}
