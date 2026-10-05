"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MessageSquare,
  Sliders,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReviewStatusBadge } from "@/components/reviews/review-status-badge";
import { RatingStars } from "@/components/reviews/rating-stars";
import { DraftViewer } from "@/components/reviews/draft-viewer";
import { ReviewRequest, ReviewRequestStatus } from "@/types";
import { formatDate } from "@/lib/utils/formatters";

export interface ReviewDetailContentProps {
  request: ReviewRequest;
}

export function ReviewDetailContent({ request }: ReviewDetailContentProps) {
  const [currentStatus, setCurrentStatus] = React.useState(request.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/review-requests"
          className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Review Requests</span>
        </Link>
      </div>

      <PageHeader
        title="Review Workflow Dossier"
        subtitle={`Workflow ID: ${request.id} • Created ${formatDate(request.createdAt)}`}
      >
        <div className="flex items-center gap-2">
          {request.business?.id && (
            <Link
              href={`/review/${request.business.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors"
            >
              <span>Customer Flow</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <ReviewStatusBadge status={currentStatus} />
        </div>
      </PageHeader>

      {/* Future Workflow Stepper Banner */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-zinc-500 overflow-x-auto pb-1 gap-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium shrink-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white dark:bg-zinc-100 dark:text-zinc-900">
              1
            </span>
            <span>Genuine Experience Input</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-2 text-zinc-400 shrink-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500">
              2
            </span>
            <span>AI Draft (M3)</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-2 text-zinc-400 shrink-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500">
              3
            </span>
            <span>Operator Edit & Approval</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-2 text-zinc-400 shrink-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500">
              4
            </span>
            <span>Google Review Post Flow (M4)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Target Business & Review Settings */}
        <div className="space-y-6 lg:col-span-1">
          {/* Section 1: BUSINESS */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">Business</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Business Name</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {request.business?.name || "Business ID: " + request.businessId}
                </p>
              </div>

              {request.business?.client && (
                <div>
                  <span className="text-zinc-400 block text-[11px]">Client</span>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {request.business.client.name}
                  </p>
                </div>
              )}

              <div>
                <span className="text-zinc-400 block text-[11px]">Google Maps URL</span>
                {request.business?.googleMapsUrl ? (
                  <a
                    href={request.business.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium mt-0.5"
                  >
                    <span>Open Listing</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-zinc-400">None</span>
                )}
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Authorized Google Account</span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {request.googleAccount?.displayName || "Unassigned (Phase 2 OAuth)"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: REVIEW SETTINGS */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">Review Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Target Rating</span>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={request.rating} size="sm" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {request.rating} Stars
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Language</span>
                <p className="font-mono text-zinc-700 dark:text-zinc-300 uppercase mt-0.5">
                  {request.language}
                </p>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Tone</span>
                <p className="capitalize text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {request.tone || "Authentic"}
                </p>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px]">Requested Length</span>
                <p className="capitalize text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {request.requestedLength || "Standard"}
                </p>
              </div>

              {request.keywords && (
                <div>
                  <span className="text-zinc-400 block text-[11px]">Keywords / Focus Points</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.keywords.split(",").map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[11px] text-zinc-600 dark:text-zinc-300"
                      >
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Experience & Generated Review Canvas */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 3: CUSTOMER EXPERIENCE */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">
                  Customer Experience (Source Truth)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200/80 dark:border-zinc-800/80 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 font-sans">
                {request.experience}
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Operator verified genuine experience. All synthesized drafts must preserve this authentic account.</span>
              </p>
            </CardContent>
          </Card>

          {/* Section 4: GENERATED REVIEW (Draft Viewer) */}
          <DraftViewer
            drafts={request.drafts}
            reviewRequestId={request.id}
            experience={request.experience}
            rating={request.rating}
            businessName={request.business?.name}
            googleReviewUrl={request.business?.googleReviewUrl || request.business?.googleMapsUrl}
            onStatusChange={(newStatus) => setCurrentStatus(newStatus as ReviewRequestStatus)}
          />
        </div>
      </div>
    </div>
  );
}
