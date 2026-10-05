import * as React from "react";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityItem } from "@/components/ui/activity-item";
import { ActivityLog } from "@/types";

export interface RecentActivityListProps {
  logs: ActivityLog[];
}

export function RecentActivityList({ logs }: RecentActivityListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </div>
        <Link
          href="/activity"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-400">
            No activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {logs.slice(0, 5).map((log) => {
              const formatLogTitle = () => {
                switch (log.action) {
                  case "CLIENT_CREATED":
                    return "Client added";
                  case "BUSINESS_CREATED":
                    return "Business added";
                  case "GOOGLE_ACCOUNT_CONNECTED":
                    return "Google account linked (dev)";
                  case "REVIEW_REQUEST_CREATED":
                    return "Review request created";
                  case "REVIEW_APPROVED":
                    return "Review draft approved";
                  default:
                    return log.action.replace(/_/g, " ");
                }
              };

              const metadataDesc = log.metadata
                ? Object.entries(log.metadata)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" • ")
                : undefined;

              return (
                <ActivityItem
                  key={log.id}
                  action={log.action}
                  title={formatLogTitle()}
                  description={metadataDesc}
                  timestamp={log.createdAt}
                  actorName={log.actor?.name || "Operator"}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
