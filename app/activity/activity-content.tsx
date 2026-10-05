"use client";

import * as React from "react";
import { Search, History } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ActivityLog } from "@/types";
import { formatDateTime } from "@/lib/utils/formatters";

export interface ActivityContentProps {
  initialLogs: ActivityLog[];
}

export function ActivityContent({ initialLogs }: ActivityContentProps) {
  const [logs] = React.useState<ActivityLog[]>(initialLogs);
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<string>("ALL");
  const [entityFilter, setEntityFilter] = React.useState<string>("ALL");

  const filtered = React.useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const actorName = log.actor?.name?.toLowerCase() || "";
      const entityId = log.entityId.toLowerCase();
      const entityType = log.entityType.toLowerCase();

      const matchesSearch =
        actorName.includes(q) || entityId.includes(q) || entityType.includes(q);

      const matchesAction =
        actionFilter === "ALL" ? true : log.action === actionFilter;

      const matchesEntity =
        entityFilter === "ALL" ? true : log.entityType === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, search, actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        subtitle="Immutable audit trail of all operator actions, entity lifecycles, and security events."
      />

      {/* Security Statement */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
            <History className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              Zero-Secret Audit Policy
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Audit log metadata is strictly sanitized. Access tokens, passwords, and sensitive credentials are encrypted and never written to logs.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search actor, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="ALL">All Actions</option>
          <option value="CLIENT_CREATED">CLIENT_CREATED</option>
          <option value="BUSINESS_CREATED">BUSINESS_CREATED</option>
          <option value="REVIEW_REQUEST_CREATED">REVIEW_REQUEST_CREATED</option>
          <option value="GOOGLE_ACCOUNT_CONNECTED">GOOGLE_ACCOUNT_CONNECTED</option>
          <option value="SYSTEM_SETTING_UPDATED">SYSTEM_SETTING_UPDATED</option>
        </Select>

        <Select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="ALL">All Entity Types</option>
          <option value="Client">Client</option>
          <option value="Business">Business</option>
          <option value="ReviewRequest">ReviewRequest</option>
          <option value="GoogleAccount">GoogleAccount</option>
        </Select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No activity logs match your filter criteria.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Sanitized Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-zinc-500 whitespace-nowrap font-mono">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {log.actor?.name || "Primary Operator"}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {log.actor?.email || "operator@reviewflow.local"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {log.entityType}
                    </span>
                    <span className="block text-[10px] text-zinc-400 font-mono">
                      {log.entityId}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.metadata ? (
                      <code className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded inline-block max-w-md truncate">
                        {JSON.stringify(log.metadata)}
                      </code>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
