"use client";

import * as React from "react";
import {
  FileText,
  Sparkles,
  Edit3,
  ExternalLink,
  Star,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsKPIs } from "@/types";

export interface KPICardsProps {
  kpis: AnalyticsKPIs;
  isLoading?: boolean;
}

export function KPICards({ kpis, isLoading = false }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-7 w-20 bg-zinc-300 dark:bg-zinc-700 rounded" />
              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Requests",
      value: kpis.totalRequests.toLocaleString(),
      subtext: "Review workflows started",
      icon: FileText,
      color: "text-zinc-600 dark:text-zinc-400",
      bg: "bg-zinc-100 dark:bg-zinc-800",
    },
    {
      title: "AI Generated",
      value: kpis.generated.toLocaleString(),
      subtext: kpis.totalRequests > 0
        ? `${Math.round((kpis.generated / kpis.totalRequests) * 100)}% generation rate`
        : "No drafts yet",
      icon: Sparkles,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/50",
    },
    {
      title: "Customer Edited",
      value: kpis.edited.toLocaleString(),
      subtext: kpis.generated > 0
        ? `${Math.round((kpis.edited / kpis.generated) * 100)}% personalized`
        : "No edits yet",
      icon: Edit3,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      title: "Review Copied",
      value: kpis.copied.toLocaleString(),
      subtext: kpis.generated > 0
        ? `${Math.round((kpis.copied / kpis.generated) * 100)}% copied to clipboard`
        : "No copies yet",
      icon: Copy,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      title: "Google Handoffs",
      value: kpis.googleHandoffs.toLocaleString(),
      subtext: "Opened Google Review page",
      icon: ExternalLink,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Average Rating",
      value: kpis.averageRating !== null ? `${kpis.averageRating} / 5` : "No ratings",
      subtext: kpis.totalFeedback > 0 ? `${kpis.totalFeedback} customer ratings` : "Awaiting ratings",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.title}
              className="border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {c.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${c.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${c.color}`} />
                  </div>
                </div>

                <div>
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {c.value}
                  </span>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                    {c.subtext}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {kpis.requestsSent !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3 text-center shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Notifications Sent</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{kpis.requestsSent}</span>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3 text-center shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Open Rate</span>
            <span className="text-base font-bold text-sky-600 dark:text-sky-400">{kpis.openRate ?? 0}%</span>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3 text-center shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Feedback Rate</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">{kpis.feedbackRate ?? 0}%</span>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3 text-center shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Google Handoff Rate</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{kpis.completionRate ?? 0}%</span>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3 text-center shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Reminder Rate</span>
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{kpis.reminderRate ?? 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
