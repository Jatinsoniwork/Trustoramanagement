import * as React from "react";
import { ReviewRequestStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

export interface ReviewStatusBadgeProps {
  status: ReviewRequestStatus;
}

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const getBadgeVariant = () => {
    switch (status) {
      case "APPROVED":
      case "READY_TO_SUBMIT":
      case "COMPLETED":
        return "success";
      case "REDIRECTED":
        return "default";
      case "GENERATED":
      case "EDITED":
      case "GENERATING":
        return "warning";
      case "FAILED":
      case "CANCELLED":
        return "destructive";
      case "SENT":
      case "OPENED":
      case "FEEDBACK_STARTED":
      case "FEEDBACK_SUBMITTED":
        return "default";
      case "SCHEDULED":
      case "CREATED":
      case "EXPIRED":
      case "DRAFT":
      default:
        return "neutral";
    }
  };

  const labels: Record<ReviewRequestStatus, string> = {
    DRAFT: "Draft",
    CREATED: "Created",
    SCHEDULED: "Scheduled",
    SENT: "Sent",
    OPENED: "Opened",
    FEEDBACK_STARTED: "Feedback Started",
    FEEDBACK_SUBMITTED: "Feedback Submitted",
    GENERATING: "Generating...",
    GENERATED: "Generated",
    EDITED: "Edited",
    APPROVED: "Approved",
    READY_TO_SUBMIT: "Ready to Submit",
    REDIRECTED: "Google Opened",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
  };

  return (
    <Badge variant={getBadgeVariant()}>
      {labels[status] || status}
    </Badge>
  );
}
