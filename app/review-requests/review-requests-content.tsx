"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ReviewRequestTable } from "@/components/reviews/review-request-table";
import { ReviewRequest } from "@/types";

export interface ReviewRequestsContentProps {
  initialRequests: ReviewRequest[];
}

export function ReviewRequestsContent({
  initialRequests,
}: ReviewRequestsContentProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Requests"
        subtitle="Manage genuine customer experience inputs and review generation workflows."
      >
        <Link href="/review-requests/new">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>New Review Request</span>
          </Button>
        </Link>
      </PageHeader>

      <ReviewRequestTable initialRequests={initialRequests} />
    </div>
  );
}
