import { reviewRepository } from "@/server/repositories/reviewRepository";
import { activityRepository } from "@/server/repositories/activityRepository";
import { businessRepository } from "@/server/repositories/businessRepository";
import { reviewRequestSchema, ReviewRequestInput, generateReviewSchema } from "@/lib/validation/review.schema";
import { ReviewRequest, ReviewRequestStatus, GenerateReviewInput, GenerateReviewResponse } from "@/types";
import { sanitizeText } from "@/lib/security/sanitization";
import { aiReviewService } from "@/server/services/aiReviewService";

export const reviewService = {
  async getReviewRequests(query?: {
    businessId?: string;
    status?: ReviewRequestStatus;
    rating?: number;
    language?: string;
  }): Promise<ReviewRequest[]> {
    return reviewRepository.findAll(query);
  },

  async getReviewRequestById(id: string): Promise<ReviewRequest | null> {
    return reviewRepository.findById(id);
  },

  async createReviewRequest(
    input: ReviewRequestInput,
    actorId?: string
  ): Promise<ReviewRequest> {
    const validated = reviewRequestSchema.parse({
      ...input,
      experience: sanitizeText(input.experience),
      keywords: input.keywords ? sanitizeText(input.keywords) : null,
    });

    const request = await reviewRepository.create(validated);

    await activityRepository.log({
      actorId,
      action: "REVIEW_REQUEST_CREATED",
      entityType: "ReviewRequest",
      entityId: request.id,
      metadata: {
        businessId: request.businessId,
        rating: request.rating,
        language: request.language,
      },
    });

    return request;
  },

  /**
   * Generates or regenerates an AI review draft based on customer feedback.
   */
  async generateReviewDraft(
    input: GenerateReviewInput,
    options?: {
      actorId?: string;
      clientIp?: string;
      variantIndex?: number;
    }
  ): Promise<GenerateReviewResponse> {
    // Validate core feedback & rating
    const validated = generateReviewSchema.parse(input);

    // If businessId is provided, enrich with safe business context
    let businessName = validated.businessName;
    let businessCategory = validated.businessCategory;
    let googleReviewUrl: string | null = null;

    if (validated.businessId) {
      const business = await businessRepository.findById(validated.businessId);
      if (business) {
        businessName = businessName || business.name;
        businessCategory = businessCategory || business.category;
        googleReviewUrl = business.googleReviewUrl || business.googleMapsUrl || null;
      }
    }

    // Call server-side AI generation service
    const generationResult = await aiReviewService.generateReview(
      {
        ...validated,
        businessName,
        businessCategory,
      },
      {
        clientIp: options?.clientIp,
        variantIndex: options?.variantIndex || 0,
      }
    );

    if (!generationResult.success || !generationResult.review) {
      return generationResult;
    }

    // If a reviewRequestId is associated, persist draft in database
    if (validated.reviewRequestId) {
      const draft = await reviewRepository.addDraft(
        validated.reviewRequestId,
        generationResult.review
      );

      await activityRepository.log({
        actorId: options?.actorId,
        action: options?.variantIndex && options.variantIndex > 0
          ? "REVIEW_GENERATED"
          : "REVIEW_GENERATED",
        entityType: "ReviewRequest",
        entityId: validated.reviewRequestId,
        metadata: {
          rating: validated.rating,
          version: draft.version,
          isRegeneration: Boolean(options?.variantIndex && options.variantIndex > 0),
        },
      });
    }

    return {
      success: true,
      review: generationResult.review,
      rating: validated.rating,
      version: generationResult.version,
      reviewRequestId: validated.reviewRequestId,
      googleReviewUrl,
    };
  },

  /**
   * Updates an existing review draft with manual customer/operator edits.
   */
  async updateDraft(
    reviewRequestId: string,
    content: string,
    actorId?: string
  ): Promise<boolean> {
    const sanitized = sanitizeText(content);
    await reviewRepository.updateDraft(reviewRequestId, sanitized);

    await activityRepository.log({
      actorId,
      action: "REVIEW_EDITED",
      entityType: "ReviewRequest",
      entityId: reviewRequestId,
      metadata: {
        contentLength: sanitized.length,
      },
    });

    return true;
  },

  /**
   * Approves a review draft for the handoff workflow.
   */
  async approveReview(
    reviewRequestId: string,
    actorId?: string
  ): Promise<boolean> {
    const success = await reviewRepository.updateStatus(reviewRequestId, "APPROVED");
    if (success) {
      await activityRepository.log({
        actorId,
        action: "REVIEW_APPROVED",
        entityType: "ReviewRequest",
        entityId: reviewRequestId,
      });
    }
    return success;
  },

  /**
   * Updates review status during customer handoff (e.g. copied, redirected to Google).
   */
  async updateHandoffStatus(
    reviewRequestId: string,
    status: ReviewRequestStatus,
    actionType?: "copied" | "redirected",
    actorId?: string
  ): Promise<boolean> {
    const success = await reviewRepository.updateStatus(reviewRequestId, status);
    if (success && actionType) {
      await activityRepository.log({
        actorId,
        action: actionType === "copied" ? "REVIEW_COPIED" : "REVIEW_REDIRECTED_TO_GOOGLE",
        entityType: "ReviewRequest",
        entityId: reviewRequestId,
        metadata: {
          newStatus: status,
        },
      });
    }
    return success;
  },

  /**
   * Returns AI Generation integration status.
   */
  async getGenerationStatus(): Promise<{
    available: boolean;
    milestone: string;
    message: string;
    hasApiKey: boolean;
  }> {
    const hasApiKey = Boolean(process.env.AI_API_KEY || process.env.GEMINI_API_KEY);
    return {
      available: true,
      milestone: "Milestone 3",
      message: "AI review draft generation is active with Anti-Fabrication safeguards.",
      hasApiKey,
    };
  },
};
