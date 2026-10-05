"use client";

import React, { useEffect } from "react";
import { ReviewRequest } from "@/types";
import {
  X,
  Star,
  Sparkles,
  FileEdit,
  Copy,
  CheckCircle2,
  MapPin,
  Calendar,
  Building2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface ReviewDetailModalProps {
  review: ReviewRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewDetailModal({ review, isOpen, onClose }: ReviewDetailModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !review) return null;

  // Determine drafts
  const sortedDrafts = review.drafts
    ? [...review.drafts].sort((a, b) => a.version - b.version)
    : [];
  const originalDraft = sortedDrafts[0]?.content || null;
  const currentDraft =
    review.drafts?.find((d) => d.isCurrent)?.content ||
    sortedDrafts[sortedDrafts.length - 1]?.content ||
    null;
  const wasEdited = Boolean(originalDraft && currentDraft && originalDraft !== currentDraft);

  const formatDate = (dateInput?: Date | string | null) => {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          label: "AI Generated",
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
          label: status,
        };
    }
  };

  const statusBadge = getStatusBadge(review.status);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusBadge.bg}`}
              >
                {statusBadge.label}
              </span>
              {review.regenerationCount && review.regenerationCount > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {review.regenerationCount} regenerations
                </span>
              ) : null}
            </div>

            <h2 id="modal-title" className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {review.business?.name || "Business Review Request"}
            </h2>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {review.business?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {review.business.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Created {formatDate(review.createdAt)}
              </span>
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {review.rating} / 5 Stars
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Lifecycle Milestones Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Requested</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-200">{formatDate(review.createdAt)}</p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">AI Generated</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                {sortedDrafts[0] ? formatDate(sortedDrafts[0].createdAt) : "—"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Copied to Clipboard</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                {review.copiedAt ? formatDate(review.copiedAt) : "Not copied yet"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Google Handoff</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                {review.googleHandoffAt ? formatDate(review.googleHandoffAt) : "Not handed off"}
              </p>
            </div>
          </div>

          {/* Customer Original Experience Input */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Customer Original Feedback
            </h3>
            <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
              &ldquo;{review.experience || "No specific feedback text recorded."}&rdquo;
            </div>
          </div>

          {/* AI Draft vs Final Version Side-by-Side */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Review Text Comparison
              </h3>
              {wasEdited ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <FileEdit className="w-3.5 h-3.5" />
                  Customer Edited
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Unedited Draft
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original AI Draft */}
              <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI-Generated Draft (v1)
                  </span>
                  {originalDraft && (
                    <button
                      onClick={() => handleCopy(originalDraft)}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                      title="Copy original"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap flex-1">
                  {originalDraft || "No AI draft recorded."}
                </p>
              </div>

              {/* Final / Customer Edited Version */}
              <div className="flex flex-col rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <FileEdit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    {wasEdited ? "Final Customer Version" : "Final Draft (Approved)"}
                  </span>
                  {currentDraft && (
                    <button
                      onClick={() => handleCopy(currentDraft)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition"
                      title="Copy final"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap flex-1">
                  {currentDraft || originalDraft || "No final text recorded."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Final Google review submission is customer-controlled.
          </div>

          <div className="flex items-center gap-3">
            {currentDraft && (
              <button
                onClick={() => handleCopy(currentDraft)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Review Text"}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
