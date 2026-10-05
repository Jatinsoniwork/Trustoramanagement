/**
 * Admin Analytics & Review Management Service (Milestone 4)
 *
 * Provides aggregated business metrics, funnel calculations,
 * sentiment analysis, trend history, and paginated review auditing.
 *
 * Enforces Multi-Business Data Isolation when businessId is supplied.
 */

import { reviewRepository } from "@/server/repositories/reviewRepository";
import { activityRepository } from "@/server/repositories/activityRepository";
import {
  AdminAnalyticsData,
  AdminReviewFilters,
  PaginatedReviewsResponse,
  ReviewRequest,
  ActivityLog,
} from "@/types";

export const analyticsService = {
  /**
   * Returns aggregated dashboard analytics.
   * Calculations strictly reflect actual stored records.
   */
  async getAnalytics(filters: {
    businessId?: string;
    dateRange?: "today" | "yesterday" | "7d" | "30d" | "90d" | "all";
  }): Promise<AdminAnalyticsData> {
    return reviewRepository.getAnalytics(filters);
  },

  /**
   * Returns filterable and paginated review management rows.
   */
  async getReviews(filters: AdminReviewFilters): Promise<PaginatedReviewsResponse> {
    return reviewRepository.findPaginated(filters);
  },

  /**
   * Returns complete review detail with original customer experience,
   * AI-generated draft, final customer edited version, and timestamps.
   */
  async getReviewDetail(id: string): Promise<ReviewRequest | null> {
    return reviewRepository.findById(id);
  },

  /**
   * Returns recent audit and activity events, optionally isolated by business.
   */
  async getActivity(filters?: {
    businessId?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    return activityRepository.findAll({
      businessId: filters?.businessId,
      limit: filters?.limit || 20,
    });
  },
};
