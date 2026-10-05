import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "@/server/services/reviewService";
import { reviewRepository } from "@/server/repositories/reviewRepository";
import { generateReviewSchema } from "@/lib/validation/review.schema";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, getClientIp } from "@/lib/security/rateLimit";
import { sanitizePromptInput, sanitizeText } from "@/lib/security/sanitization";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check (AI quota & abuse protection: 15 req / min per IP)
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, RATE_LIMITS.AI_GENERATE);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, "AI generation rate limit reached. Please wait a moment.");
    }

    const body = await request.json();

    // 2. Zod input validation
    const validated = generateReviewSchema.safeParse(body);
    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message || "Invalid review feedback input.";
      return NextResponse.json(
        {
          success: false,
          message: firstError,
        },
        { status: 400 }
      );
    }

    // 3. Replay Protection: If linked to an existing request, verify it is not in terminal completed state
    if (validated.data.reviewRequestId) {
      const existingReq = await reviewRepository.findById(validated.data.reviewRequestId);
      if (existingReq) {
        if (existingReq.status === "CANCELLED") {
          return NextResponse.json(
            { success: false, message: "This review request has been cancelled." },
            { status: 410 }
          );
        }
        if (existingReq.optedOut) {
          return NextResponse.json(
            { success: false, message: "Customer has opted out of this review flow." },
            { status: 410 }
          );
        }
      }
    }

    // 4. Prompt Injection Defense: Sanitize customer feedback & highlights
    const sanitizedFeedback = sanitizePromptInput(validated.data.feedback, 2000);
    const sanitizedHighlights = validated.data.highlights
      ? sanitizePromptInput(validated.data.highlights, 200)
      : undefined;
    const sanitizedService = validated.data.service
      ? sanitizeText(validated.data.service).slice(0, 150)
      : undefined;

    const variantIndex = typeof body.variantIndex === "number" ? body.variantIndex : 0;

    // 5. Generate review via reviewService
    const result = await reviewService.generateReviewDraft(
      {
        ...validated.data,
        feedback: sanitizedFeedback,
        highlights: sanitizedHighlights,
        service: sanitizedService,
      },
      {
        clientIp,
        variantIndex,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "We couldn't generate the review right now. Please try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      review: result.review,
      rating: result.rating,
      version: result.version || 1,
      reviewRequestId: result.reviewRequestId,
      googleReviewUrl: result.googleReviewUrl,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error during generation.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
