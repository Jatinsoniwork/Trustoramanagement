"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StarRatingInputProps {
  value: number; // 0 means unselected
  onChange: (rating: number) => void;
  disabled?: boolean;
  error?: string;
  size?: "md" | "lg";
}

const RATING_LABELS: Record<number, string> = {
  1: "1 Star - Poor / Critical",
  2: "2 Stars - Disappointing",
  3: "3 Stars - Average / Neutral",
  4: "4 Stars - Good experience",
  5: "5 Stars - Great experience",
};

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  error,
  size = "lg",
}: StarRatingInputProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  const activeRating = hovered !== null ? hovered : value;
  const starSizeClass = size === "lg" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-7 w-7 sm:h-8 sm:w-8";

  const handleKeyDown = (e: React.KeyboardEvent, starNum: number) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(starNum);
    } else if (e.key === "ArrowRight" && starNum < 5) {
      e.preventDefault();
      onChange(starNum + 1);
    } else if (e.key === "ArrowLeft" && starNum > 1) {
      e.preventDefault();
      onChange(starNum - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Star rating selection"
        className="flex items-center gap-1.5 sm:gap-2"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((starNum) => {
          const isFilled = starNum <= activeRating;
          const isSelected = starNum === value;

          return (
            <button
              key={starNum}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${starNum} Star${starNum > 1 ? "s" : ""}`}
              tabIndex={disabled ? -1 : 0}
              disabled={disabled}
              onClick={() => onChange(starNum)}
              onMouseEnter={() => !disabled && setHovered(starNum)}
              onKeyDown={(e) => handleKeyDown(e, starNum)}
              className={cn(
                "p-1.5 rounded-lg transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                "active:scale-90 hover:scale-110",
                starSizeClass
              )}
            >
              <Star
                className={cn(
                  "w-full h-full transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-500 drop-shadow-xs"
                    : "fill-transparent text-zinc-300 dark:text-zinc-700 hover:text-zinc-400"
                )}
              />
            </button>
          );
        })}

        {/* Selected Rating Text Label */}
        <span className="ml-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[120px]">
          {activeRating > 0 ? (
            RATING_LABELS[activeRating]
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">Select rating</span>
          )}
        </span>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
