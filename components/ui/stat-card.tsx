import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "./card";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  badge?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5 flex flex-col justify-between transition-all hover:border-zinc-300 dark:hover:border-zinc-700", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </span>
          {badge && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
