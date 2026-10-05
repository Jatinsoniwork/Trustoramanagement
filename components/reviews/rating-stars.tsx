import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingStars({
  rating,
  max = 5,
  size = "sm",
  className,
}: RatingStarsProps) {
  const sizeMap = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-300 dark:fill-zinc-800 dark:text-zinc-700"
          )}
        />
      ))}
    </div>
  );
}
