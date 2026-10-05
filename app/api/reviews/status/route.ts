import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "@/server/services/reviewService";
import { reviewRepository } from "@/server/repositories/reviewRepository";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/security/rateLimit";
import { sanitizeText } from "@/lib/security/sanitization";
import { ReviewRequestStatus } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check (30 actions / min per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, { maxRequests: 30, windowMs: 60 * 1000, identifier: "review-status" });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "Too many review actions. Please wait a moment.");
    }

    const body = await request.json();
    const { reviewRequestId, action, content, status } = body;

    if (!reviewRequestId || typeof reviewRequestId !== "string") {
      return NextResponse.json(
        { success: false, message: "Missing valid reviewRequestId." },
        { status: 400 }
      );
    }

    // 2. Existence & Terminal State Check
    const existing = await reviewRepository.findById(reviewRequestId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Review request not found." },
        { status: 404 }
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "This review request has been cancelled." },
        { status: 410 }
      );
    }

    if (action === "edit" && content) {
      const sanitized = sanitizeText(String(content)).slice(0, 4000);
      await reviewService.updateDraft(reviewRequestId, sanitized);
      return NextResponse.json({ success: true, message: "Draft updated successfully." });
    }

    if (action === "approve") {
      await reviewService.approveReview(reviewRequestId);
      return NextResponse.json({ success: true, message: "Review approved." });
    }

    if (action === "copy") {
      await reviewService.updateHandoffStatus(
        reviewRequestId,
        "READY_TO_SUBMIT",
        "copied"
      );
      return NextResponse.json({ success: true, message: "Review copied." });
    }

    if (action === "redirect") {
      await reviewService.updateHandoffStatus(
        reviewRequestId,
        "REDIRECTED",
        "redirected"
      );
      return NextResponse.json({ success: true, message: "Handoff initiated." });
    }

    if (status) {
      await reviewService.updateHandoffStatus(
        reviewRequestId,
        status as ReviewRequestStatus
      );
      return NextResponse.json({ success: true, message: `Status updated to ${status}.` });
    }

    return NextResponse.json(
      { success: false, message: "Unrecognized review action." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update review status." },
      { status: 500 }
    );
  }
}
