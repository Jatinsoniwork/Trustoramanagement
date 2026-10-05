"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminAnalyticsData,
  PaginatedReviewsResponse,
  Business,
  AdminReviewFilters,
  ActivityLog,
} from "@/types";
import { KPICards } from "./kpi-cards";
import { FunnelChart } from "./funnel-chart";
import { RatingDistributionCard } from "./rating-distribution-card";
import { TrendChart } from "./trend-chart";
import { FeedbackThemesCard } from "./feedback-themes-card";
import { ReviewManagementTable } from "./review-management-table";
import { RecentActivityCard } from "./recent-activity-card";
import { AutomationSettingsModal } from "./automation-settings-modal";
import { ManualRequestModal } from "./manual-request-modal";
import { ServiceSimulatorModal } from "./service-simulator-modal";
import {
  Building2,
  Calendar,
  RefreshCw,
  LogOut,
  Shield,
  Send,
  Zap,
  Settings,
  BellRing,
} from "lucide-react";

interface AdminDashboardViewProps {
  initialAnalytics: AdminAnalyticsData;
  initialReviews: PaginatedReviewsResponse;
  initialActivity: ActivityLog[];
  businesses: Business[];
  adminUser?: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminDashboardView({
  initialAnalytics,
  initialReviews,
  initialActivity,
  businesses,
  adminUser,
}: AdminDashboardViewProps) {
  const router = useRouter();

  // Filters state
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<
    "today" | "yesterday" | "7d" | "30d" | "90d" | "all"
  >("all");
  const [reviewFilters, setReviewFilters] = useState<AdminReviewFilters>({
    page: 1,
    limit: 10,
    dateRange: "all",
  });

  // Data state
  const [analytics, setAnalytics] = useState<AdminAnalyticsData>(initialAnalytics);
  const [reviewsData, setReviewsData] = useState<PaginatedReviewsResponse>(initialReviews);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivity);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Milestone 5 Automation Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isManualRequestOpen, setIsManualRequestOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [isRunningReminders, setIsRunningReminders] = useState<boolean>(false);

  // Fetch updated analytics & reviews
  const loadDashboardData = useCallback(
    async (
      bizId: string = selectedBusinessId,
      range: AdminReviewFilters["dateRange"] = dateRange,
      tableFilters: Partial<AdminReviewFilters> = {}
    ) => {
      setIsLoading(true);
      try {
        const queryBiz = bizId === "ALL" ? "" : bizId;
        const targetDate = tableFilters.dateRange || range || "all";

        // 1. Fetch Analytics
        const analyticsParams = new URLSearchParams();
        if (queryBiz) analyticsParams.set("businessId", queryBiz);
        if (targetDate) analyticsParams.set("dateRange", targetDate);

        const analyticsRes = await fetch(`/api/admin/analytics?${analyticsParams.toString()}`);
        if (analyticsRes.ok) {
          const json = await analyticsRes.json();
          if (json.success && json.data) {
            setAnalytics(json.data);
          }
        }

        // 2. Fetch Reviews
        const reviewsParams = new URLSearchParams();
        if (queryBiz) reviewsParams.set("businessId", queryBiz);
        if (targetDate) reviewsParams.set("dateRange", targetDate);
        if (tableFilters.rating) reviewsParams.set("rating", tableFilters.rating.toString());
        if (tableFilters.status && tableFilters.status !== "ALL")
          reviewsParams.set("status", tableFilters.status);
        if (tableFilters.search) reviewsParams.set("search", tableFilters.search);
        reviewsParams.set("page", (tableFilters.page || 1).toString());
        reviewsParams.set("limit", (tableFilters.limit || 10).toString());

        const reviewsRes = await fetch(`/api/admin/reviews?${reviewsParams.toString()}`);
        if (reviewsRes.ok) {
          const json = await reviewsRes.json();
          if (json.success && json.data) {
            setReviewsData(json.data);
          }
        }

        // 3. Fetch Activity
        const activityParams = new URLSearchParams();
        if (queryBiz) activityParams.set("businessId", queryBiz);
        activityParams.set("limit", "15");

        const activityRes = await fetch(`/api/admin/activity?${activityParams.toString()}`);
        if (activityRes.ok) {
          const json = await activityRes.json();
          if (json.success && json.data) {
            setActivities(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to refresh admin dashboard data:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedBusinessId, dateRange]
  );

  const handleBusinessChange = (bizId: string) => {
    setSelectedBusinessId(bizId);
    setReviewFilters((prev) => ({ ...prev, businessId: bizId === "ALL" ? undefined : bizId, page: 1 }));
    loadDashboardData(bizId, dateRange, { ...reviewFilters, page: 1 });
  };

  const handleDateRangeChange = (range: "today" | "yesterday" | "7d" | "30d" | "90d" | "all") => {
    setDateRange(range);
    setReviewFilters((prev) => ({ ...prev, dateRange: range, page: 1 }));
    loadDashboardData(selectedBusinessId, range, { ...reviewFilters, dateRange: range, page: 1 });
  };

  const handleTableFilterChange = (updates: Partial<AdminReviewFilters>) => {
    const updated = { ...reviewFilters, ...updates };
    setReviewFilters(updated);
    loadDashboardData(selectedBusinessId, updated.dateRange || dateRange, updated);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData(selectedBusinessId, dateRange, reviewFilters);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push("/admin/login");
    }
  };

  const handleRunReminders = async () => {
    setIsRunningReminders(true);
    setReminderNotice(null);
    try {
      const res = await fetch("/api/automation/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessId === "ALL" ? undefined : selectedBusinessId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReminderNotice(`Reminder check complete: ${data.sent} sent, ${data.skipped} skipped.`);
        loadDashboardData(selectedBusinessId, dateRange, reviewFilters);
      } else {
        setReminderNotice("Failed to run reminder check.");
      }
    } catch {
      setReminderNotice("Network error running reminder check.");
    } finally {
      setIsRunningReminders(false);
      setTimeout(() => setReminderNotice(null), 5000);
    }
  };

  const currentBusinessName =
    selectedBusinessId === "ALL"
      ? "All Businesses"
      : businesses.find((b) => b.id === selectedBusinessId)?.name || "Selected Business";

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Admin Header Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Authenticated Admin Console {adminUser ? `(${adminUser.name})` : ""}
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs text-zinc-500 font-medium">Milestone 4 Analytics</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            Review Performance & Analytics
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time pipeline monitoring, rating distribution, conversion funnel, and customer feedback.
          </p>
        </div>

        {/* Global Controls: Business selector, Date filter, Refresh, Profile */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Multi-Business Selector (Enforces isolation) */}
          <div className="relative flex items-center">
            <Building2 className="w-4 h-4 text-zinc-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedBusinessId}
              onChange={(e) => handleBusinessChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
              aria-label="Filter by Business"
            >
              <option value="ALL">🏢 All Businesses ({businesses.length})</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.location || "Default"})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-zinc-400 absolute left-2.5 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) =>
                handleDateRangeChange(
                  e.target.value as "today" | "yesterday" | "7d" | "30d" | "90d" | "all"
                )
              }
              className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
              aria-label="Date Range"
            >
              <option value="all">📅 All Time</option>
              <option value="today">📅 Today</option>
              <option value="yesterday">📅 Yesterday</option>
              <option value="7d">📅 Last 7 Days</option>
              <option value="30d">📅 Last 30 Days</option>
              <option value="90d">📅 Last 90 Days</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition shadow-xs disabled:opacity-40"
            title="Refresh analytics data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Automation Quick Actions Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Review Automation
          </span>
          {reminderNotice && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {reminderNotice}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManualRequestOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Create Request</span>
          </button>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition shadow-2xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Service Event</span>
          </button>

          <button
            onClick={handleRunReminders}
            disabled={isRunningReminders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition shadow-2xs cursor-pointer disabled:opacity-40"
          >
            <BellRing className={`w-3.5 h-3.5 ${isRunningReminders ? "animate-spin" : ""}`} />
            <span>Check Reminders</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Automation Settings</span>
          </button>
        </div>
      </div>

      {/* Section 1: KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Performance Highlights — {currentBusinessName}
          </h2>
          {analytics.peakActivityText && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              💡 {analytics.peakActivityText}
            </span>
          )}
        </div>
        <KPICards kpis={analytics.kpis} isLoading={isLoading} />
      </div>

      {/* Section 2: Conversion Funnel & Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart funnel={analytics.funnel} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <RatingDistributionCard
            distribution={analytics.ratingDistribution}
            averageRating={analytics.kpis.averageRating}
            sentiment={analytics.sentiment}
            totalRatings={analytics.funnel[0]?.count || 0}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Section 3: Trends & Feedback Themes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            trends={analytics.trends}
            peakActivityText={analytics.peakActivityText}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <FeedbackThemesCard themes={analytics.feedbackThemes} isLoading={isLoading} />
        </div>
      </div>

      {/* Section 4: Review Management Table */}
      <div>
        <ReviewManagementTable
          reviews={reviewsData.items}
          total={reviewsData.total}
          page={reviewsData.page}
          totalPages={reviewsData.totalPages}
          filters={reviewFilters}
          onFilterChange={handleTableFilterChange}
          isLoading={isLoading}
        />
      </div>

      {/* Section 5: Recent Activity Feed */}
      <div>
        <RecentActivityCard activities={activities} isLoading={isLoading} />
      </div>

      {/* Milestone 5 Automation Modals */}
      <AutomationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        businessId={selectedBusinessId === "ALL" ? businesses[0]?.id || "demo-biz-1" : selectedBusinessId}
        businessName={currentBusinessName}
        onSaved={() => loadDashboardData(selectedBusinessId, dateRange, reviewFilters)}
      />

      <ManualRequestModal
        isOpen={isManualRequestOpen}
        onClose={() => setIsManualRequestOpen(false)}
        businesses={businesses}
        defaultBusinessId={selectedBusinessId}
        onCreated={() => loadDashboardData(selectedBusinessId, dateRange, reviewFilters)}
      />

      <ServiceSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        businesses={businesses}
        defaultBusinessId={selectedBusinessId}
        onTriggered={() => loadDashboardData(selectedBusinessId, dateRange, reviewFilters)}
      />
    </div>
  );
}
