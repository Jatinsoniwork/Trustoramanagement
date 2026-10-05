"use client";

import * as React from "react";
import { TrendingUp, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendDataPoint } from "@/types";

export interface TrendChartProps {
  trends: TrendDataPoint[];
  peakActivityText?: string | null;
  isLoading?: boolean;
}

export function TrendChart({
  trends,
  peakActivityText,
  isLoading = false,
}: TrendChartProps) {
  const [metric, setMetric] = React.useState<"requests" | "generated" | "googleHandoffs" | "averageRating">("requests");

  if (isLoading) {
    return (
      <Card className="border-zinc-200/90 dark:border-zinc-800 animate-pulse">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold">Review Activity Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-5 h-48 bg-zinc-100 dark:bg-zinc-800 rounded m-4" />
      </Card>
    );
  }

  // Calculate maximum for scaling
  const values = trends.map((t) => (metric === "averageRating" ? t.averageRating || 0 : t[metric]));
  const maxValue = Math.max(...values, metric === "averageRating" ? 5 : 1);

  const metricLabels: Record<string, string> = {
    requests: "Review Requests",
    generated: "AI Drafts Generated",
    googleHandoffs: "Google Handoffs",
    averageRating: "Average Rating",
  };

  return (
    <Card className="border-zinc-200/90 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Review Activity Trends
          </CardTitle>
        </div>

        {/* Switchable Metric Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg text-xs overflow-x-auto">
          {(["requests", "generated", "googleHandoffs", "averageRating"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap ${
                metric === m
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {metricLabels[m]}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Trend Bar Chart */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2 border-b border-zinc-100 dark:border-zinc-800">
            {trends.map((t) => {
              const val = metric === "averageRating" ? t.averageRating || 0 : t[metric];
              const heightPct = maxValue > 0 ? Math.round((val / maxValue) * 100) : 0;

              return (
                <div
                  key={t.date}
                  className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end"
                >
                  {/* Tooltip value */}
                  <span className="text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300 opacity-80 group-hover:opacity-100">
                    {metric === "averageRating" ? (val > 0 ? `${val}★` : "—") : val}
                  </span>

                  {/* Vertical bar */}
                  <div className="w-full max-w-[32px] bg-zinc-100 dark:bg-zinc-800/80 rounded-t-md overflow-hidden flex items-end h-32">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        metric === "averageRating"
                          ? "bg-amber-400"
                          : metric === "googleHandoffs"
                          ? "bg-emerald-500"
                          : metric === "generated"
                          ? "bg-sky-500"
                          : "bg-zinc-800 dark:bg-zinc-200"
                      }`}
                      style={{ height: `${Math.max(heightPct, val > 0 ? 8 : 2)}%` }}
                    />
                  </div>

                  {/* Date label */}
                  <span className="text-[10px] text-zinc-400 truncate max-w-[48px] text-center">
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Activity Operational Insight */}
        {peakActivityText && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-300">
            <Zap className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <span className="font-medium">{peakActivityText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
