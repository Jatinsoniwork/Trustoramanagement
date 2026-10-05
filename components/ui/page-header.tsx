import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-6",
        className
      )}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
