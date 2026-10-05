"use client";

import * as React from "react";
import { Lightbulb, Tag, Quote } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FeedbackThemeInsight } from "@/types";

export interface FeedbackThemesCardProps {
  themes: FeedbackThemeInsight[];
  isLoading?: boolean;
}

export function FeedbackThemesCard({
  themes,
  isLoading = false,
}: FeedbackThemesCardProps) {
  if (isLoading) {
    return (
      <Card className="border-zinc-200/90 dark:border-zinc-800 animate-pulse">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold">Customer Feedback Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </CardContent>
      </Card>
    );
  }

  const sentimentStyles = {
    positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    neutral: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    negative: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
  };

  return (
    <Card className="border-zinc-200/90 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Customer Feedback Themes
          </CardTitle>
        </div>
        <span className="text-xs text-zinc-400">Classified from genuine reviews</span>
      </CardHeader>

      <CardContent className="p-5">
        {themes.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-xs">
            No customer feedback themes detected yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => (
              <div
                key={t.theme}
                className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <Tag className="h-3 w-3 text-zinc-400" />
                    <span>{t.theme}</span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border ${sentimentStyles[t.sentiment]}`}
                  >
                    {t.sentiment} • {t.count} mentions
                  </span>
                </div>

                {t.sampleFeedback && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic flex items-start gap-1">
                    <Quote className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-700 mt-0.5" />
                    <span>&ldquo;{t.sampleFeedback}&rdquo;</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
