import * as React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/20",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
