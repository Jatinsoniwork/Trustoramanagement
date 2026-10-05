"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Tag,
  FileText,
  Sliders,
  History,
  AlertCircle,
  Plus,
  Edit2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BusinessFormModal } from "@/components/businesses/business-form-modal";
import { Business, Client, ReviewRequest } from "@/types";
import { BusinessInput } from "@/lib/validation/business.schema";
import { formatDate } from "@/lib/utils/formatters";

export interface BusinessDetailContentProps {
  initialBusiness: Business;
  clients: Client[];
  associatedReviews: ReviewRequest[];
}

export function BusinessDetailContent({
  initialBusiness,
  clients,
  associatedReviews,
}: BusinessDetailContentProps) {
  const [business, setBusiness] = React.useState<Business>(initialBusiness);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const handleUpdateBusiness = async (data: BusinessInput) => {
    const parent = clients.find((c) => c.id === data.clientId);
    setBusiness((prev) => ({
      ...prev,
      ...data,
      client: parent || prev.client,
      updatedAt: new Date(),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/businesses"
          className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Businesses</span>
        </Link>
      </div>

      <PageHeader
        title={business.name}
        subtitle="Business establishment details, Google Maps configuration, and active review workflows."
      >
        <Link href={`/review/${business.id}`} target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Customer Review Page</span>
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditOpen(true)}
          className="gap-1.5"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit Business</span>
        </Button>
        <Link href="/review-requests/new">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>New Review Request</span>
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business Metadata */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Listing Details</CardTitle>
              <Badge variant={business.status === "ACTIVE" ? "success" : "neutral"}>
                {business.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Client Account</span>
              {business.client ? (
                <Link
                  href={`/clients/${business.clientId}`}
                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline mt-0.5 inline-block"
                >
                  {business.client.name}
                </Link>
              ) : (
                <span className="text-zinc-500">Client ID: {business.clientId}</span>
              )}
            </div>

            <div>
              <span className="text-zinc-400 block text-[11px]">Category</span>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 mt-0.5">
                <Tag className="h-3.5 w-3.5 text-zinc-400" />
                <span>{business.category}</span>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 block text-[11px]">Location</span>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>{business.location}</span>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 block text-[11px]">Google Maps Listing</span>
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium mt-0.5"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {business.googleReviewUrl && (
              <div>
                <span className="text-zinc-400 block text-[11px]">Direct Google Review URL</span>
                <a
                  href={business.googleReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 truncate max-w-full"
                >
                  <span className="truncate">Open Direct Review Page</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[11px]">Customer Flow URL</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <code className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded truncate flex-1">
                  /review/{business.id}
                </code>
                <Link
                  href={`/review/${business.id}`}
                  target="_blank"
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-0.5 shrink-0"
                >
                  <span>Launch</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {business.placeIdentifier && (
              <div>
                <span className="text-zinc-400 block text-[11px]">Place ID</span>
                <code className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {business.placeIdentifier}
                </code>
              </div>
            )}

            {business.notes && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 block text-[11px] mb-1">Operator Notes</span>
                <p className="text-zinc-600 dark:text-zinc-300 italic bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                  {business.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Workflows & Future Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Review Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">
                  Review Workflows ({associatedReviews.length})
                </CardTitle>
              </div>
              <Link href="/review-requests/new">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Create Request</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {associatedReviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No review requests created for this business yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {associatedReviews.map((r) => (
                    <div
                      key={r.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {r.experience}
                        </p>
                        <span className="text-[11px] text-zinc-400">
                          {formatDate(r.createdAt)} • Rating: {r.rating}★ • Status: {r.status}
                        </span>
                      </div>
                      <Link href={`/review-requests/${r.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Future Section 1: Google Review Configuration Placeholder */}
          <Card className="border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-zinc-400" />
                <CardTitle className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Google Review Configuration (Milestone 2)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-zinc-500 space-y-2">
              <p>
                In Milestone 2, this section will allow selecting an authorized Google account, configuring automated URL query parameters, and validating Google Business Profile API place mapping.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Reserved for Milestone 2: Google OAuth & GBP API Integration.</span>
              </div>
            </CardContent>
          </Card>

          {/* Future Section 2: Review History Placeholder */}
          <Card className="border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-zinc-400" />
                <CardTitle className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Review History & Live Post Telemetry (Milestone 4)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-zinc-500 space-y-2">
              <p>
                Telemetry tracking posted reviews, approval timestamps, and Google Maps live verification logs will be integrated in Milestone 4.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BusinessFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        clients={clients}
        businessToEdit={business}
        onSubmit={handleUpdateBusiness}
      />
    </div>
  );
}
