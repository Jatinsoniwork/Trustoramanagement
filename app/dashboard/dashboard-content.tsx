"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Users, Building2, Share2, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { BusinessFormModal } from "@/components/businesses/business-form-modal";
import { getGreeting } from "@/lib/utils/formatters";
import { Client, Business, GoogleAccount, ReviewRequest, ActivityLog } from "@/types";
import { ClientInput } from "@/lib/validation/client.schema";
import { BusinessInput } from "@/lib/validation/business.schema";

export interface DashboardContentProps {
  initialClients: Client[];
  initialBusinesses: Business[];
  initialAccounts: GoogleAccount[];
  initialReviews: ReviewRequest[];
  initialActivity: ActivityLog[];
}

export function DashboardContent({
  initialClients,
  initialBusinesses,
  initialAccounts,
  initialReviews,
  initialActivity,
}: DashboardContentProps) {
  const [clients, setClients] = React.useState(initialClients);
  const [businesses, setBusinesses] = React.useState(initialBusinesses);
  const [reviews] = React.useState(initialReviews);
  const [activity, setActivity] = React.useState(initialActivity);

  const [addClientOpen, setAddClientOpen] = React.useState(false);
  const [addBusinessOpen, setAddBusinessOpen] = React.useState(false);

  // Compute metrics
  const totalClients = clients.length;
  const totalBusinesses = businesses.length;
  const connectedAccounts = initialAccounts.filter((a) => a.status === "CONNECTED").length;
  const pendingReviews = reviews.filter((r) => r.status === "DRAFT" || r.status === "GENERATING").length;
  const approvedReviews = reviews.filter((r) => r.status === "APPROVED" || r.status === "COMPLETED").length;

  const handleCreateClient = async (data: ClientInput) => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: data.name,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { businesses: 0 },
    };
    setClients((prev) => [newClient, ...prev]);

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: newClient.id,
      metadata: { name: newClient.name },
      createdAt: new Date(),
      actor: {
        id: "operator-1",
        name: "Primary Operator",
        email: "operator@reviewflow.local",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    setActivity((prev) => [newLog, ...prev]);
  };

  const handleCreateBusiness = async (data: BusinessInput) => {
    const parentClient = clients.find((c) => c.id === data.clientId);
    const newBiz: Business = {
      id: `biz-${Date.now()}`,
      clientId: data.clientId,
      name: data.name,
      googleMapsUrl: data.googleMapsUrl,
      placeIdentifier: data.placeIdentifier,
      category: data.category,
      location: data.location,
      notes: data.notes,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: parentClient,
      _count: { reviewRequests: 0 },
    };
    setBusinesses((prev) => [newBiz, ...prev]);

    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      action: "BUSINESS_CREATED",
      entityType: "Business",
      entityId: newBiz.id,
      metadata: { name: newBiz.name, category: newBiz.category },
      createdAt: new Date(),
      actor: {
        id: "operator-1",
        name: "Primary Operator",
        email: "operator@reviewflow.local",
        role: "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    setActivity((prev) => [newLog, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={getGreeting()}
        subtitle="Manage your clients, businesses and review workflows from one place."
      >
        <Link href="/review-requests/new">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>New Review Request</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Clients"
          value={totalClients}
          description="Managed client accounts"
          icon={Users}
        />
        <StatCard
          title="Total Businesses"
          value={totalBusinesses}
          description="Registered establishments"
          icon={Building2}
        />
        <StatCard
          title="Connected Google Accounts"
          value={connectedAccounts}
          description="Milestone 2 OAuth"
          icon={Share2}
        />
        <StatCard
          title="Pending Reviews"
          value={pendingReviews}
          description="Drafts awaiting drafting"
          icon={Clock}
        />
        <StatCard
          title="Approved Reviews"
          value={approvedReviews}
          description="Ready for posting flow"
          icon={CheckCircle2}
        />
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <QuickActions
            onAddClient={() => setAddClientOpen(true)}
            onAddBusiness={() => setAddBusinessOpen(true)}
          />

          <RecentActivityList logs={activity} />
        </div>

        {/* Operational Guardrails & Principles Box */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Operator Integrity Protocol
            </h3>
            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="leading-relaxed">
                ReviewFlow operates strictly on authentic, verified customer experiences supplied by the operator.
              </p>
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] space-y-1.5">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                  System Restrictions:
                </span>
                <ul className="list-disc list-inside space-y-1 text-zinc-500">
                  <li>Never fabricate customer experiences</li>
                  <li>No simulated visits, purchases, or interactions</li>
                  <li>No spam, botting, or manipulated campaigns</li>
                  <li>Human review and manual operator approval required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClientFormModal
        isOpen={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onSubmit={handleCreateClient}
      />

      <BusinessFormModal
        isOpen={addBusinessOpen}
        onClose={() => setAddBusinessOpen(false)}
        clients={clients}
        onSubmit={handleCreateBusiness}
      />
    </div>
  );
}
