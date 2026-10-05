"use client";

import * as React from "react";
import { Star, Smile, Meh, Frown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RatingDistributionItem, SentimentOverview } from "@/types";

export interface RatingDistributionCardProps {
  averageRating: number | null;
  totalRatings: number;
  distribution: RatingDistributionItem[];
  sentiment: SentimentOverview;
  selectedRating?: number;
  onSelectRating?: (rating?: number) => void;
  isLoading?: boolean;
}

export function RatingDistributionCard({
  averageRating,
  totalRatings,
  distribution,
  sentiment,
  selectedRating,
  onSelectRating,
  isLoading = false,
}: RatingDistributionCardProps) {
  if (isLoading) {
    return (
      <Card className="border-zinc-200/90 dark:border-zinc-800 animate-pulse">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold">Rating & Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200/90 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Rating & Sentiment Distribution
          </CardTitle>
        </div>
        {selectedRating && onSelectRating && (
          <button
            type="button"
            onClick={() => onSelectRating(undefined)}
            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
          >
            Clear Filter
          </button>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Prominent Average Rating Display */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Average Rating</span>
            {averageRating !== null ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {averageRating}
                </span>
                <span className="text-sm text-zinc-400">/ 5</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-zinc-500 mt-1 block">
                No ratings yet
              </span>
            )}
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    averageRating !== null && star <= Math.round(averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-300 dark:text-zinc-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500 mt-1 block">
              {totalRatings} total {totalRatings === 1 ? "rating" : "ratings"}
            </span>
          </div>
        </div>

        {/* 1–5 Star Rating Distribution Bars */}
        <div className="space-y-2">
          {distribution.map((item) => {
            const isSelected = selectedRating === item.stars;
            return (
              <button
                key={item.stars}
                type="button"
                onClick={() => onSelectRating && onSelectRating(isSelected ? undefined : item.stars)}
                className={`w-full flex items-center gap-2 text-xs py-1 px-1.5 rounded-lg transition-colors text-left ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/40 ring-1 ring-sky-500"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-1 w-14 shrink-0 text-zinc-700 dark:text-zinc-300 font-medium">
                  <span>{item.stars}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </div>

                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.stars >= 4
                        ? "bg-emerald-500"
                        : item.stars === 3
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 w-16 justify-end font-mono text-[11px] text-zinc-500 shrink-0">
                  <span>{item.count}</span>
                  <span className="text-zinc-400">({item.percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sentiment Overview Section */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-400 block mb-2">
            Sentiment Overview
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/30">
              <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <Smile className="h-3.5 w-3.5" />
                <span>Positive</span>
              </div>
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-300 block mt-0.5">
                {sentiment.positivePct}%
              </span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">
                {sentiment.positive} reviews
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/30">
              <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <Meh className="h-3.5 w-3.5" />
                <span>Neutral</span>
              </div>
              <span className="text-base font-bold text-amber-800 dark:text-amber-300 block mt-0.5">
                {sentiment.neutralPct}%
              </span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70">
                {sentiment.neutral} reviews
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/30">
              <div className="flex items-center justify-center gap-1 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                <Frown className="h-3.5 w-3.5" />
                <span>Critical</span>
              </div>
              <span className="text-base font-bold text-rose-800 dark:text-rose-300 block mt-0.5">
                {sentiment.negativePct}%
              </span>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-400/70">
                {sentiment.negative} reviews
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
