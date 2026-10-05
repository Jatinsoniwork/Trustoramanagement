"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Eye } from "lucide-react";
import { ReviewRequest } from "@/types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingStars } from "./rating-stars";
import { ReviewStatusBadge } from "./review-status-badge";
import { formatDate } from "@/lib/utils/formatters";

export interface ReviewRequestTableProps {
  initialRequests: ReviewRequest[];
}

export function ReviewRequestTable({
  initialRequests,
}: ReviewRequestTableProps) {
  const router = useRouter();
  const requests = initialRequests;
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = React.useState<string>("ALL");
  const [languageFilter, setLanguageFilter] = React.useState<string>("ALL");

  const filtered = React.useMemo(() => {
    return requests.filter((r) => {
      const bizName = r.business?.name?.toLowerCase() || "";
      const clientName = r.business?.client?.name?.toLowerCase() || "";
      const expText = r.experience.toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch =
        bizName.includes(q) || clientName.includes(q) || expText.includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : r.status === statusFilter;

      const matchesRating =
        ratingFilter === "ALL" ? true : r.rating.toString() === ratingFilter;

      const matchesLanguage =
        languageFilter === "ALL" ? true : r.language === languageFilter;

      return matchesSearch && matchesStatus && matchesRating && matchesLanguage;
    });
  }, [requests, search, statusFilter, ratingFilter, languageFilter]);

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No review requests yet"
        description="Review requests store genuine customer experiences and configure future AI drafts."
        actionLabel="Create Review Request"
        onAction={() => {
          router.push("/review-requests/new");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search experience, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="GENERATING">Generating</option>
          <option value="GENERATED">Generated</option>
          <option value="EDITED">Edited</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>

        <Select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="ALL">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </Select>

        <Select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="h-9 text-xs"
        >
          <option value="ALL">All Languages</option>
          <option value="en">English (en)</option>
          <option value="es">Spanish (es)</option>
          <option value="fr">French (fr)</option>
          <option value="de">German (de)</option>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No review requests match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Link
                      href={`/review-requests/${req.id}`}
                      className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                    >
                      {req.business?.name || `Business ${req.businessId}`}
                    </Link>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-xs mt-0.5">
                      {req.experience}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    {req.business?.client?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <RatingStars rating={req.rating} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs font-mono uppercase text-zinc-500">
                    {req.language}
                  </TableCell>
                  <TableCell>
                    <ReviewStatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {formatDate(req.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/review-requests/${req.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                        title="View Workflow Detail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
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
