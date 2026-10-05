"use client";

import React, { useState } from "react";
import { ReviewRequest, AdminReviewFilters } from "@/types";
import {
  Search,
  Download,
  Eye,
  Copy,
  ExternalLink,
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Link2,
  RotateCcw,
} from "lucide-react";
import { ReviewDetailModal } from "./review-detail-modal";

interface ReviewManagementTableProps {
  reviews: ReviewRequest[];
  total: number;
  page: number;
  totalPages: number;
  filters: AdminReviewFilters;
  onFilterChange: (filters: Partial<AdminReviewFilters>) => void;
  isLoading?: boolean;
}

export function ReviewManagementTable({
  reviews,
  total,
  page,
  totalPages,
  filters,
  onFilterChange,
  isLoading,
}: ReviewManagementTableProps) {
  const [selectedReview, setSelectedReview] = useState<ReviewRequest | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyReviewLink = (token: string, id: string) => {
    const url = `${window.location.origin}/review/request/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(`link-${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    setActionNotice(null);
    try {
      const res = await fetch(`/api/automation/requests/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice("Notification resent successfully.");
      } else {
        setActionNotice(data.message || "Failed to resend notification.");
      }
    } catch {
      setActionNotice("Network error while resending notification.");
    } finally {
      setResendingId(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const exportCSV = () => {
    if (reviews.length === 0) return;

    const headers = [
      "ID",
      "Date",
      "Business",
      "Rating",
      "Status",
      "Original Feedback",
      "Generated/Final Review",
      "Customer Edited",
      "Copied",
      "Google Handoff",
    ];

    const rows = reviews.map((r) => {
      const draft = r.drafts?.find((d) => d.isCurrent)?.content || r.drafts?.[0]?.content || "";
      const isEdited = r.status === "EDITED" || (r.drafts && r.drafts.length > 1);
      const isCopied = r.status === "READY_TO_SUBMIT" || r.status === "REDIRECTED" || Boolean(r.copiedAt);
      const isHandoff = r.status === "REDIRECTED" || Boolean(r.googleHandoffAt);

      return [
        r.id,
        new Date(r.createdAt).toISOString(),
        `"${(r.business?.name || "").replace(/"/g, '""')}"`,
        r.rating,
        r.status,
        `"${(r.experience || "").replace(/"/g, '""')}"`,
        `"${draft.replace(/"/g, '""')}"`,
        isEdited ? "YES" : "NO",
        isCopied ? "YES" : "NO",
        isHandoff ? "YES" : "NO",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reviews_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REDIRECTED":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          label: "Google Handoff",
        };
      case "READY_TO_SUBMIT":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          label: "Copied",
        };
      case "EDITED":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          label: "Customer Edited",
        };
      case "GENERATED":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          label: "Generated",
        };
      case "FEEDBACK_SUBMITTED":
        return {
          bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
          label: "Feedback Submitted",
        };
      case "OPENED":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
          label: "Opened",
        };
      case "SENT":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
          label: "Sent",
        };
      case "SCHEDULED":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          label: "Scheduled",
        };
      case "EXPIRED":
        return {
          bg: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
          label: "Expired",
        };
      case "CANCELLED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          label: "Cancelled",
        };
      case "DRAFT":
        return {
          bg: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
          label: "Requested",
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
          label: status,
        };
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Header & Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              Review Submissions & Activity
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal">
                {total} total records
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage incoming review requests, customer edits, and Google handoffs.
            </p>
            {actionNotice && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                ℹ️ {actionNotice}
              </p>
            )}
          </div>

          <button
            onClick={exportCSV}
            disabled={reviews.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export CSV
          </button>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feedback or reviews..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={filters.dateRange || "all"}
              onChange={(e) =>
                onFilterChange({
                  dateRange: e.target.value as AdminReviewFilters["dateRange"],
                  page: 1,
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Date: All Time</option>
              <option value="today">Date: Today</option>
              <option value="yesterday">Date: Yesterday</option>
              <option value="7d">Date: Last 7 Days</option>
              <option value="30d">Date: Last 30 Days</option>
              <option value="90d">Date: Last 90 Days</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={filters.rating || ""}
              onChange={(e) =>
                onFilterChange({
                  rating: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  page: 1,
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Rating: All Stars</option>
              <option value="5">Rating: 5 Stars</option>
              <option value="4">Rating: 4 Stars</option>
              <option value="3">Rating: 3 Stars</option>
              <option value="2">Rating: 2 Stars</option>
              <option value="1">Rating: 1 Star</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || "ALL"}
              onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="GENERATED">Status: AI Generated</option>
              <option value="EDITED">Status: Customer Edited</option>
              <option value="COPIED">Status: Copied</option>
              <option value="GOOGLE_HANDOFF">Status: Google Handoff</option>
              <option value="REQUESTED">Status: Requested (Draft)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Business</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 min-w-[180px]">Customer Feedback</th>
              <th className="py-3 px-4 min-w-[200px]">Review Draft</th>
              <th className="py-3 px-3 text-center">Edited</th>
              <th className="py-3 px-3 text-center">Copied</th>
              <th className="py-3 px-3 text-center">Handoff</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={10} className="py-4 px-4">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center">
                    <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-300">No review records found</p>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1">
                      No review requests match your selected filters. Try broadening your date range or clearing filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              reviews.map((r) => {
                const latestDraft =
                  r.drafts?.find((d) => d.isCurrent)?.content || r.drafts?.[0]?.content || "";
                const isEdited = r.status === "EDITED" || (r.drafts && r.drafts.length > 1);
                const isCopied =
                  r.status === "READY_TO_SUBMIT" || r.status === "REDIRECTED" || Boolean(r.copiedAt);
                const isHandoff = r.status === "REDIRECTED" || Boolean(r.googleHandoffAt);
                const badge = getStatusBadge(r.status);
                const dateStr = new Date(r.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {dateStr}
                    </td>

                    {/* Business & Customer */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-900 dark:text-zinc-200">
                      <div className="font-medium text-xs">{r.business?.name || "—"}</div>
                      {r.customerName && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{r.customerName}</span>
                          {r.channel && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase font-semibold">
                              {r.channel}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{r.rating}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Customer Feedback */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-300">
                      {r.experience || <span className="text-zinc-400 italic">None</span>}
                    </td>

                    {/* Generated Review Draft */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-300">
                      {latestDraft || <span className="text-zinc-400 italic">No draft</span>}
                    </td>

                    {/* Indicators: Edited, Copied, Handoff */}
                    <td className="py-3.5 px-3 text-center">
                      {isEdited ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-500 inline-block" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {isCopied ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 inline-block" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {isHandoff ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Customer Review Link */}
                        {r.requestToken && (
                          <button
                            onClick={() => handleCopyReviewLink(r.requestToken!, r.id)}
                            className="p-1.5 text-zinc-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
                            title={copiedId === `link-${r.id}` ? "Link Copied!" : "Copy Customer Review Link"}
                          >
                            {copiedId === `link-${r.id}` ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Link2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Resend Notification */}
                        {(r.status === "SENT" || r.status === "OPENED" || r.status === "CREATED") && (
                          <button
                            onClick={() => handleResend(r.id)}
                            disabled={resendingId === r.id}
                            className="p-1.5 text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition disabled:opacity-40"
                            title="Resend notification to customer"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${resendingId === r.id ? "animate-spin" : ""}`} />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedReview(r)}
                          className="p-1.5 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
                          title="View detail modal"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {latestDraft && (
                          <button
                            onClick={() => handleCopy(latestDraft, r.id)}
                            className="p-1.5 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
                            title={copiedId === r.id ? "Copied!" : "Copy review text"}
                          >
                            {copiedId === r.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {r.business?.googleReviewUrl && (
                          <a
                            href={r.business.googleReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
                            title="Open Google Review URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div>
          Showing Page <span className="font-semibold text-zinc-900 dark:text-white">{page}</span> of{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">{totalPages}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onFilterChange({ page: Math.max(1, page - 1) })}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 font-medium text-zinc-700 dark:text-zinc-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onFilterChange({ page: Math.min(totalPages, page + 1) })}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  );
}
