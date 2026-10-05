"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Eye, Edit2, MapPin, ExternalLink } from "lucide-react";
import { Business } from "@/types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";

export interface BusinessTableProps {
  initialBusinesses: Business[];
  onAddBusiness?: () => void;
  onEditBusiness?: (business: Business) => void;
}

export function BusinessTable({
  initialBusinesses,
  onAddBusiness,
  onEditBusiness,
}: BusinessTableProps) {
  const [businesses] = React.useState<Business[]>(initialBusinesses);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");

  const categories = React.useMemo(() => {
    return Array.from(new Set(businesses.map((b) => b.category)));
  }, [businesses]);

  const filteredBusinesses = React.useMemo(() => {
    return businesses.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase()) ||
        (b.client?.name && b.client.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ? true : b.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" ? true : b.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [businesses, search, statusFilter, categoryFilter]);

  if (businesses.length === 0) {
    return (
      <EmptyState
        title="No businesses found"
        description="Add a physical business location or Google Maps listing under one of your clients."
        actionLabel="Add your first business"
        onAction={onAddBusiness}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search businesses, locations, or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-36 h-9 text-xs"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32 h-9 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        {filteredBusinesses.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No businesses match your filter criteria.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Google Maps Status</TableHead>
                <TableHead className="text-center">Reviews</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link
                      href={`/businesses/${b.id}`}
                      className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {b.name}
                    </Link>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {b.placeIdentifier ? `Place: ${b.placeIdentifier}` : "No Place ID"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.client ? (
                      <Link
                        href={`/clients/${b.clientId}`}
                        className="text-xs text-zinc-700 dark:text-zinc-300 hover:underline"
                      >
                        {b.client.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-400">Client {b.clientId}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    {b.category}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{b.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.googleMapsUrl ? (
                      <a
                        href={b.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
                      >
                        <span>Verified URL</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-400">Missing URL</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 text-xs text-zinc-700 dark:text-zinc-300">
                      {b._count?.reviewRequests ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.status === "ACTIVE" ? "success" : "neutral"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/businesses/${b.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                          title="View Business"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {onEditBusiness && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditBusiness(b)}
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                          title="Edit Business"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
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
