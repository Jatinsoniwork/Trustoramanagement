"use client";

import React from "react";
import { ActivityLog } from "@/types";
import {
  Sparkles,
  FileEdit,
  Copy,
  ExternalLink,
  PlusCircle,
  Share2,
  CheckCircle,
  Activity,
  Clock,
} from "lucide-react";

interface RecentActivityCardProps {
  activities: ActivityLog[];
  isLoading?: boolean;
}

export function RecentActivityCard({ activities, isLoading }: RecentActivityCardProps) {
  const getActionConfig = (action: string) => {
    switch (action) {
      case "REVIEW_REDIRECTED_TO_GOOGLE":
        return {
          icon: ExternalLink,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
          title: "Google Review Handoff",
          description: "Customer clicked handoff button to submit review on Google",
        };
      case "REVIEW_COPIED":
        return {
          icon: Copy,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
          title: "Review Copied",
          description: "Customer copied final approved review text to clipboard",
        };
      case "REVIEW_EDITED":
        return {
          icon: FileEdit,
          color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
          title: "Review Edited",
          description: "Customer refined AI-generated draft before approval",
        };
      case "REVIEW_GENERATED":
        return {
          icon: Sparkles,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
          title: "AI Review Generated",
          description: "AI synthesized draft review from customer experience input",
        };
      case "REVIEW_REQUEST_CREATED":
        return {
          icon: PlusCircle,
          color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
          title: "Feedback Submitted",
          description: "Customer initiated review request with rating and feedback",
        };
      case "GOOGLE_ACCOUNT_CONNECTED":
        return {
          icon: Share2,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
          title: "Google Account Connected",
          description: "OAuth connection established with Google Business Profile",
        };
      default:
        return {
          icon: CheckCircle,
          color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
          title: action.replace(/_/g, " "),
          description: "System event logged",
        };
    }
  };

  const formatTimestamp = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Recent Review Activity
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time audit log of customer submissions and handoffs
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {activities.length} events
        </span>
      </div>

      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No activity logs recorded for this period.
          </div>
        ) : (
          activities.map((act) => {
            const config = getActionConfig(act.action);
            const Icon = config.icon;

            return (
              <div
                key={act.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {config.title}
                    </p>
                    <span className="text-[11px] text-zinc-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(act.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {config.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
