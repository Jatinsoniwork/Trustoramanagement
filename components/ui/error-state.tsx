import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this section. Please try again.",
  retryLabel = "Try Again",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 p-8 text-center",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-300">
        {title}
      </h3>
      <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
