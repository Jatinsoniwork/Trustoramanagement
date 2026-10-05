"use client";

import * as React from "react";
import { Filter, ArrowDown, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FunnelStep } from "@/types";

export interface FunnelChartProps {
  funnel: FunnelStep[];
  isLoading?: boolean;
}

export function FunnelChart({ funnel, isLoading = false }: FunnelChartProps) {
  if (isLoading) {
    return (
      <Card className="border-zinc-200/90 dark:border-zinc-800">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold">Review Funnel</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const stepColors: Record<string, string> = {
    REQUESTED: "bg-zinc-800 dark:bg-zinc-200",
    FEEDBACK: "bg-sky-600",
    GENERATED: "bg-blue-600",
    EDITED: "bg-amber-500",
    COPIED: "bg-indigo-600",
    HANDOFF: "bg-emerald-600",
  };

  return (
    <Card className="border-zinc-200/90 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Customer Conversion Funnel
          </CardTitle>
        </div>
        <span className="text-xs text-zinc-400">Step-by-step pipeline</span>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {funnel.map((step, idx) => {
          const barColor = stepColors[step.step] || "bg-sky-600";
          return (
            <div key={step.step} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-400 w-4">
                    0{idx + 1}
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {step.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {step.count.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 w-10 text-right">
                    {step.percentage}%
                  </span>
                  {idx > 0 && step.dropoffPercentage > 0 && (
                    <span className="inline-flex items-center text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
                      <ArrowDown className="h-2.5 w-2.5 mr-0.5" />
                      {step.dropoffPercentage}%
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(step.percentage, step.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-400" />
          <span>
            Google handoffs track customers who proceed to the official Google Review page. The customer retains final posting authority.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
