import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-600 mb-3" />
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}
