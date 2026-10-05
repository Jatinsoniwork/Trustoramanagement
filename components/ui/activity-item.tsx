import * as React from "react";
import {
  UserPlus,
  Building2,
  FileText,
  CheckCircle2,
  Link2,
  Clock,
  Sparkles,
  Settings,
  Copy,
  ExternalLink,
  LucideIcon,
} from "lucide-react";
import { ActivityAction } from "@/types";
import { formatRelativeTime } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

export interface ActivityItemProps {
  action: ActivityAction;
  title: string;
  description?: string;
  timestamp: Date | string;
  actorName?: string;
  className?: string;
}

const ACTION_ICONS: Record<ActivityAction, LucideIcon> = {
  CLIENT_CREATED: UserPlus,
  CLIENT_UPDATED: UserPlus,
  CLIENT_DEACTIVATED: UserPlus,
  BUSINESS_CREATED: Building2,
  BUSINESS_UPDATED: Building2,
  BUSINESS_DEACTIVATED: Building2,
  GOOGLE_ACCOUNT_CONNECTED: Link2,
  GOOGLE_ACCOUNT_RECONNECTED: Link2,
  GOOGLE_ACCOUNT_DISCONNECTED: Link2,
  GOOGLE_ACCOUNT_REAUTH_REQUIRED: Clock,
  GOOGLE_ACCOUNT_REFRESH_FAILED: Clock,
  REVIEW_REQUEST_CREATED: FileText,
  REVIEW_REQUEST_SCHEDULED: Clock,
  REVIEW_REQUEST_SENT: FileText,
  REVIEW_REQUEST_OPENED: ExternalLink,
  REVIEW_REQUEST_UPDATED: FileText,
  FEEDBACK_STARTED: FileText,
  FEEDBACK_SUBMITTED: CheckCircle2,
  REVIEW_GENERATED: Sparkles,
  REVIEW_EDITED: FileText,
  REVIEW_APPROVED: CheckCircle2,
  REVIEW_COPIED: Copy,
  REVIEW_REDIRECTED_TO_GOOGLE: ExternalLink,
  REVIEW_COMPLETED: CheckCircle2,
  SERVICE_COMPLETED: CheckCircle2,
  REMINDER_SENT: Clock,
  REQUEST_COMPLETED: CheckCircle2,
  REQUEST_EXPIRED: Clock,
  REQUEST_CANCELLED: Clock,
  NOTIFICATION_FAILED: Clock,
  CUSTOMER_OPTED_OUT: Clock,
  AUTOMATION_SETTINGS_UPDATED: Settings,
  SYSTEM_SETTING_UPDATED: Settings,
};

export function ActivityItem({
  action,
  title,
  description,
  timestamp,
  actorName,
  className,
}: ActivityItemProps) {
  const Icon = ACTION_ICONS[action] || Clock;

  return (
    <div className={cn("flex items-start gap-3.5 py-3 first:pt-0 last:pb-0", className)}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </p>
          <span className="text-[11px] text-zinc-400 shrink-0">
            {formatRelativeTime(timestamp)}
          </span>
        </div>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
        {actorName && (
          <span className="inline-block mt-1 text-[10px] text-zinc-400">
            By {actorName}
          </span>
        )}
      </div>
    </div>
  );
}
