"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Eye, Edit2, UserX } from "lucide-react";
import { Client } from "@/types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/formatters";

export interface ClientTableProps {
  initialClients: Client[];
  onAddClient?: () => void;
  onEditClient?: (client: Client) => void;
  onDeactivateClient?: (client: Client) => void;
}

export function ClientTable({
  initialClients,
  onAddClient,
  onEditClient,
  onDeactivateClient,
}: ClientTableProps) {
  const clients = initialClients;
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"newest" | "name">("newest");

  const filteredClients = React.useMemo(() => {
    return clients
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.contactName.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" ? true : c.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [clients, search, statusFilter, sortBy]);

  if (clients.length === 0) {
    return (
      <EmptyState
        title="No clients yet"
        description="Get started by registering your first client organization to manage reviews for."
        actionLabel="Add your first client"
        onAction={onAddClient}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by client, contact, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32 h-9 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "name")}
            className="w-32 h-9 text-xs"
          >
            <option value="newest">Newest first</option>
            <option value="name">Alphabetical</option>
          </Select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No clients match your filter criteria.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Businesses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {client.name}
                    </Link>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      ID: {client.id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {client.contactName}
                    </div>
                    <div className="text-[11px] text-zinc-400">{client.email}</div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 text-xs text-zinc-700 dark:text-zinc-300">
                      {client._count?.businesses ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === "ACTIVE" ? "success" : "neutral"}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {formatDate(client.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/clients/${client.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                          title="View Client"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {onEditClient && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditClient(client)}
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                          title="Edit Client"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onDeactivateClient && client.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeactivateClient(client)}
                          className="h-8 w-8 text-zinc-400 hover:text-rose-600"
                          title="Deactivate Client"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
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
