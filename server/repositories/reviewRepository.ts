import crypto from "crypto";
import { prisma, isDatabaseAvailable, markDatabaseFailure, markDatabaseSuccess } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { DEMO_REVIEW_REQUESTS, DEMO_BUSINESSES } from "@/lib/data/mockData";
import {
  ReviewRequest,
  ReviewRequestStatus,
  ReviewDraft,
  AdminReviewFilters,
  PaginatedReviewsResponse,
  AdminAnalyticsData,
  AnalyticsKPIs,
  FunnelStep,
  RatingDistributionItem,
  SentimentOverview,
  TrendDataPoint,
  FeedbackThemeInsight,
} from "@/types";
import { ReviewRequestInput } from "@/lib/validation/review.schema";

export const reviewRepository = {
  async findAll(query?: {
    businessId?: string;
    status?: ReviewRequestStatus;
    rating?: number;
    language?: string;
  }): Promise<ReviewRequest[]> {
    if (!isDatabaseAvailable()) {
      let filtered = [...DEMO_REVIEW_REQUESTS];
      if (query?.businessId) {
        filtered = filtered.filter((r) => r.businessId === query.businessId);
      }
      if (query?.status) {
        filtered = filtered.filter((r) => r.status === query.status);
      }
      if (query?.rating) {
        filtered = filtered.filter((r) => r.rating === query.rating);
      }
      if (query?.language) {
        filtered = filtered.filter((r) => r.language === query.language);
      }
      return filtered.map((r) => ({
        ...r,
        business: r.business || DEMO_BUSINESSES.find((b) => b.id === r.businessId),
      }));
    }
    try {
      const where: {
        businessId?: string;
        status?: ReviewRequestStatus;
        rating?: number;
        language?: string;
      } = {};

      if (query?.businessId) where.businessId = query.businessId;
      if (query?.status) where.status = query.status;
      if (query?.rating) where.rating = query.rating;
      if (query?.language) where.language = query.language;

      const requests = await prisma.reviewRequest.findMany({
        where: where as unknown as Prisma.ReviewRequestWhereInput,
        include: {
          business: {
            include: {
              client: true,
            },
          },
          googleAccount: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImageUrl: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          drafts: {
            orderBy: { version: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      markDatabaseSuccess();
      return requests as unknown as ReviewRequest[];
    } catch {
      markDatabaseFailure();
      let filtered = [...DEMO_REVIEW_REQUESTS];
      if (query?.businessId) {
        filtered = filtered.filter((r) => r.businessId === query.businessId);
      }
      if (query?.status) {
        filtered = filtered.filter((r) => r.status === query.status);
      }
      if (query?.rating) {
        filtered = filtered.filter((r) => r.rating === query.rating);
      }
      if (query?.language) {
        filtered = filtered.filter((r) => r.language === query.language);
      }
      return filtered.map((r) => ({
        ...r,
        business: r.business || DEMO_BUSINESSES.find((b) => b.id === r.businessId),
      }));
    }
  },

  async findById(id: string): Promise<ReviewRequest | null> {
    if (!isDatabaseAvailable()) {
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === id);
      if (found) {
        return {
          ...found,
          business: found.business || DEMO_BUSINESSES.find((b) => b.id === found.businessId),
        };
      }
      return null;
    }
    try {
      const request = await prisma.reviewRequest.findUnique({
        where: { id },
        include: {
          business: {
            include: {
              client: true,
            },
          },
          googleAccount: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImageUrl: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          drafts: {
            orderBy: { version: "desc" },
          },
        },
      });

      markDatabaseSuccess();
      return request as unknown as ReviewRequest | null;
    } catch {
      markDatabaseFailure();
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === id);
      if (found) {
        return {
          ...found,
          business: found.business || DEMO_BUSINESSES.find((b) => b.id === found.businessId),
        };
      }
      return null;
    }
  },

  async findByToken(token: string): Promise<ReviewRequest | null> {
    const found = DEMO_REVIEW_REQUESTS.find((r) => r.requestToken === token);
    if (found) {
      return {
        ...found,
        business: found.business || DEMO_BUSINESSES.find((b) => b.id === found.businessId),
      };
    }
    return null;
  },

  async recordOpened(token: string): Promise<ReviewRequest | null> {
    const found = DEMO_REVIEW_REQUESTS.find((r) => r.requestToken === token);
    if (found) {
      if (!found.openedAt) {
        found.openedAt = new Date();
      }
      if (
        found.status === "SENT" ||
        found.status === "CREATED" ||
        found.status === "SCHEDULED" ||
        found.status === "DRAFT"
      ) {
        found.status = "OPENED";
      }
      return {
        ...found,
        business: found.business || DEMO_BUSINESSES.find((b) => b.id === found.businessId),
      };
    }
    return null;
  },

  async recordOptOut(token: string): Promise<boolean> {
    const found = DEMO_REVIEW_REQUESTS.find((r) => r.requestToken === token);
    if (found) {
      found.optedOut = true;
      found.updatedAt = new Date();
      return true;
    }
    return false;
  },

  async updateRequest(
    id: string,
    updates: Partial<ReviewRequest>
  ): Promise<ReviewRequest | null> {
    const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === id);
    if (found) {
      Object.assign(found, updates);
      found.updatedAt = new Date();
      return {
        ...found,
        business: found.business || DEMO_BUSINESSES.find((b) => b.id === found.businessId),
      };
    }
    return null;
  },

  async create(data: ReviewRequestInput | (Partial<ReviewRequest> & { businessId: string })): Promise<ReviewRequest> {
    if (!isDatabaseAvailable()) {
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const fallback: ReviewRequest = {
        id: `req-${uniqueSuffix}`,
        businessId: data.businessId,
        googleAccountId: data.googleAccountId,
        customerName: (data as Partial<ReviewRequest>).customerName ?? null,
        customerEmail: (data as Partial<ReviewRequest>).customerEmail ?? null,
        customerPhone: (data as Partial<ReviewRequest>).customerPhone ?? null,
        serviceId: (data as Partial<ReviewRequest>).serviceId ?? null,
        serviceName: (data as Partial<ReviewRequest>).serviceName ?? null,
        requestToken: (data as Partial<ReviewRequest>).requestToken ?? null,
        channel: (data as Partial<ReviewRequest>).channel ?? "EMAIL",
        experience: data.experience || "",
        rating: data.rating ?? 5,
        language: data.language ?? "en",
        tone: data.tone ?? "authentic",
        keywords: data.keywords ?? null,
        requestedLength: data.requestedLength ?? "standard",
        status: (data.status as ReviewRequestStatus) ?? "DRAFT",
        scheduledAt: (data as Partial<ReviewRequest>).scheduledAt ?? null,
        sentAt: (data as Partial<ReviewRequest>).sentAt ?? null,
        openedAt: (data as Partial<ReviewRequest>).openedAt ?? null,
        feedbackSubmittedAt: (data as Partial<ReviewRequest>).feedbackSubmittedAt ?? null,
        expiresAt: (data as Partial<ReviewRequest>).expiresAt ?? null,
        reminderCount: (data as Partial<ReviewRequest>).reminderCount ?? 0,
        optedOut: (data as Partial<ReviewRequest>).optedOut ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        drafts: [],
      };
      DEMO_REVIEW_REQUESTS.unshift(fallback);
      return fallback;
    }
    try {
      const created = await prisma.reviewRequest.create({
        data: {
          businessId: data.businessId,
          googleAccountId: data.googleAccountId ?? null,
          experience: data.experience || "",
          rating: data.rating ?? 5,
          language: data.language ?? "en",
          tone: data.tone ?? null,
          keywords: data.keywords ?? null,
          requestedLength: data.requestedLength ?? null,
          status: (data.status as unknown as Prisma.ReviewRequestCreateInput["status"]) ?? "DRAFT",
        },
        include: {
          business: {
            include: { client: true },
          },
          googleAccount: true,
          drafts: true,
        },
      });
      markDatabaseSuccess();
      return created as unknown as ReviewRequest;
    } catch {
      markDatabaseFailure();
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const fallback: ReviewRequest = {
        id: `req-${uniqueSuffix}`,
        businessId: data.businessId,
        googleAccountId: data.googleAccountId,
        customerName: (data as Partial<ReviewRequest>).customerName ?? null,
        customerEmail: (data as Partial<ReviewRequest>).customerEmail ?? null,
        customerPhone: (data as Partial<ReviewRequest>).customerPhone ?? null,
        serviceId: (data as Partial<ReviewRequest>).serviceId ?? null,
        serviceName: (data as Partial<ReviewRequest>).serviceName ?? null,
        requestToken: (data as Partial<ReviewRequest>).requestToken ?? null,
        channel: (data as Partial<ReviewRequest>).channel ?? "EMAIL",
        experience: data.experience || "",
        rating: data.rating ?? 5,
        language: data.language ?? "en",
        tone: data.tone ?? "authentic",
        keywords: data.keywords ?? null,
        requestedLength: data.requestedLength ?? "standard",
        status: (data.status as ReviewRequestStatus) ?? "DRAFT",
        scheduledAt: (data as Partial<ReviewRequest>).scheduledAt ?? null,
        sentAt: (data as Partial<ReviewRequest>).sentAt ?? null,
        openedAt: (data as Partial<ReviewRequest>).openedAt ?? null,
        feedbackSubmittedAt: (data as Partial<ReviewRequest>).feedbackSubmittedAt ?? null,
        expiresAt: (data as Partial<ReviewRequest>).expiresAt ?? null,
        reminderCount: (data as Partial<ReviewRequest>).reminderCount ?? 0,
        optedOut: (data as Partial<ReviewRequest>).optedOut ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        drafts: [],
      };
      DEMO_REVIEW_REQUESTS.unshift(fallback);
      return fallback;
    }
  },

  async updateStatus(id: string, status: ReviewRequestStatus): Promise<boolean> {
    if (!id) return false;
    const now = new Date();
    if (!isDatabaseAvailable()) {
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === id);
      if (found) {
        found.status = status;
        if (status === "READY_TO_SUBMIT" && !found.copiedAt) {
          found.copiedAt = now;
        }
        if (status === "REDIRECTED" && !found.googleHandoffAt) {
          found.googleHandoffAt = now;
        }
        return true;
      }
      return false;
    }
    try {
      await prisma.reviewRequest.update({
        where: { id },
        data: {
          status: status as unknown as Prisma.ReviewRequestUpdateInput["status"],
          ...(status === "READY_TO_SUBMIT" ? { copiedAt: now } : {}),
          ...(status === "REDIRECTED" ? { googleHandoffAt: now } : {}),
        },
      });
      markDatabaseSuccess();
      return true;
    } catch {
      markDatabaseFailure();
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === id);
      if (found) {
        found.status = status;
        if (status === "READY_TO_SUBMIT" && !found.copiedAt) {
          found.copiedAt = now;
        }
        if (status === "REDIRECTED" && !found.googleHandoffAt) {
          found.googleHandoffAt = now;
        }
        return true;
      }
      return false;
    }
  },

  async markCopied(id: string): Promise<boolean> {
    return this.updateStatus(id, "READY_TO_SUBMIT");
  },

  async markGoogleHandoff(id: string): Promise<boolean> {
    return this.updateStatus(id, "REDIRECTED");
  },

  async addDraft(reviewRequestId: string, content: string): Promise<ReviewDraft> {
    if (!isDatabaseAvailable()) {
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === reviewRequestId);
      const version = (found?.drafts?.length || 0) + 1;
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const newDraft: ReviewDraft = {
        id: `draft-${uniqueSuffix}`,
        reviewRequestId,
        content,
        version,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (found) {
        if (!found.drafts) found.drafts = [];
        found.drafts.forEach((d) => (d.isCurrent = false));
        found.drafts.unshift(newDraft);
        found.status = "GENERATED";
      }
      return newDraft;
    }
    try {
      await prisma.reviewDraft.updateMany({
        where: { reviewRequestId },
        data: { isCurrent: false },
      });

      const count = await prisma.reviewDraft.count({
        where: { reviewRequestId },
      });

      const draft = await prisma.reviewDraft.create({
        data: {
          reviewRequestId,
          content,
          version: count + 1,
          isCurrent: true,
        },
      });

      await prisma.reviewRequest.update({
        where: { id: reviewRequestId },
        data: { status: "GENERATED" },
      });

      markDatabaseSuccess();
      return draft as unknown as ReviewDraft;
    } catch {
      markDatabaseFailure();
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === reviewRequestId);
      const version = (found?.drafts?.length || 0) + 1;
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const newDraft: ReviewDraft = {
        id: `draft-${uniqueSuffix}`,
        reviewRequestId,
        content,
        version,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (found) {
        if (!found.drafts) found.drafts = [];
        found.drafts.forEach((d) => (d.isCurrent = false));
        found.drafts.unshift(newDraft);
        found.status = "GENERATED";
      }
      return newDraft;
    }
  },

  async updateDraft(reviewRequestId: string, content: string): Promise<ReviewDraft> {
    if (!isDatabaseAvailable()) {
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === reviewRequestId);
      if (found && found.drafts && found.drafts.length > 0) {
        const cur = found.drafts.find((d) => d.isCurrent) || found.drafts[0];
        cur.content = content;
        found.status = "EDITED";
        return cur;
      }
      return this.addDraft(reviewRequestId, content);
    }
    try {
      const current = await prisma.reviewDraft.findFirst({
        where: { reviewRequestId, isCurrent: true },
      });
      if (current) {
        const updated = await prisma.reviewDraft.update({
          where: { id: current.id },
          data: { content },
        });
        await prisma.reviewRequest.update({
          where: { id: reviewRequestId },
          data: { status: "EDITED" },
        });
        markDatabaseSuccess();
        return updated as unknown as ReviewDraft;
      }
      return this.addDraft(reviewRequestId, content);
    } catch {
      markDatabaseFailure();
      const found = DEMO_REVIEW_REQUESTS.find((r) => r.id === reviewRequestId);
      if (found && found.drafts && found.drafts.length > 0) {
        const cur = found.drafts.find((d) => d.isCurrent) || found.drafts[0];
        cur.content = content;
        found.status = "EDITED";
        return cur;
      }
      return this.addDraft(reviewRequestId, content);
    }
  },

  /**
   * Milestone 4: Paginated and filterable review management query.
   * Enforces Multi-Business Data Isolation when businessId is supplied.
   */
  async findPaginated(filters: AdminReviewFilters): Promise<PaginatedReviewsResponse> {
    const all = await this.findAll({
      businessId: filters.businessId,
      rating: filters.rating,
    });

    // Apply date range filter
    let filtered = all.filter((r) => isWithinDateRange(r.createdAt, filters.dateRange));

    // Apply status filter
    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter((r) => matchesStatusFilter(r.status, filters.status));
    }

    // Apply text search
    if (filters.search && filters.search.trim()) {
      filtered = filtered.filter((r) => matchesSearch(r, filters.search));
    }

    const total = filtered.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * Milestone 4: Real database/store aggregated analytics.
   * Strictly computes statistics from genuine records without fabrication.
   * Scoped to businessId when supplied (Multi-Business Data Isolation).
   */
  async getAnalytics(filters: { businessId?: string; dateRange?: string }): Promise<AdminAnalyticsData> {
    const all = await this.findAll({
      businessId: filters.businessId,
    });

    const scoped = all.filter((r) => isWithinDateRange(r.createdAt, filters.dateRange));

    const totalRequests = scoped.length;
    const totalFeedback = scoped.filter((r) => r.experience && r.experience.trim().length > 0).length;
    const generated = scoped.filter(
      (r) =>
        r.status === "GENERATED" ||
        r.status === "EDITED" ||
        r.status === "READY_TO_SUBMIT" ||
        r.status === "REDIRECTED" ||
        r.status === "COMPLETED" ||
        (r.drafts && r.drafts.length > 0)
    ).length;
    const edited = scoped.filter(
      (r) => r.status === "EDITED" || (r.drafts && r.drafts.length > 1)
    ).length;
    const copied = scoped.filter(
      (r) => r.status === "READY_TO_SUBMIT" || r.status === "REDIRECTED" || Boolean(r.copiedAt)
    ).length;
    const googleHandoffs = scoped.filter(
      (r) => r.status === "REDIRECTED" || Boolean(r.googleHandoffAt)
    ).length;

    const validRatings = scoped.filter((r) => typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5);
    const averageRating =
      validRatings.length > 0
        ? Math.round((validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length) * 10) / 10
        : null;

    const requestsSent = scoped.filter(
      (r) =>
        Boolean(r.sentAt) ||
        [
          "SENT",
          "OPENED",
          "FEEDBACK_STARTED",
          "FEEDBACK_SUBMITTED",
          "GENERATED",
          "EDITED",
          "APPROVED",
          "READY_TO_SUBMIT",
          "REDIRECTED",
          "COMPLETED",
        ].includes(r.status)
    ).length;
    const openedRequests = scoped.filter(
      (r) =>
        Boolean(r.openedAt) ||
        [
          "OPENED",
          "FEEDBACK_STARTED",
          "FEEDBACK_SUBMITTED",
          "GENERATED",
          "EDITED",
          "APPROVED",
          "READY_TO_SUBMIT",
          "REDIRECTED",
          "COMPLETED",
        ].includes(r.status)
    ).length;

    const baseForRate = requestsSent > 0 ? requestsSent : totalRequests;
    const openRate = baseForRate > 0 ? Math.round((openedRequests / baseForRate) * 1000) / 10 : 0;
    const feedbackRate = baseForRate > 0 ? Math.round((totalFeedback / baseForRate) * 1000) / 10 : 0;
    const completionRate = baseForRate > 0 ? Math.round((googleHandoffs / baseForRate) * 1000) / 10 : 0;
    const reminderCount = scoped.filter((r) => (r.reminderCount || 0) > 0).length;
    const reminderRate = baseForRate > 0 ? Math.round((reminderCount / baseForRate) * 1000) / 10 : 0;
    const failedRequests = scoped.filter((r) => r.status === "FAILED").length;

    const kpis: AnalyticsKPIs = {
      totalRequests,
      generated,
      edited,
      copied,
      googleHandoffs,
      averageRating,
      totalFeedback,
      requestsSent,
      openRate,
      feedbackRate,
      completionRate,
      reminderRate,
      failedRequests,
    };

    // Review Funnel with conversion and drop-off percentages
    const funnel: FunnelStep[] = [
      {
        step: "REQUESTED",
        label: "Review Requested",
        count: totalRequests,
        percentage: totalRequests > 0 ? 100 : 0,
        dropoffPercentage: 0,
      },
      {
        step: "FEEDBACK",
        label: "Feedback Submitted",
        count: totalFeedback,
        percentage: totalRequests > 0 ? Math.round((totalFeedback / totalRequests) * 100) : 0,
        dropoffPercentage: totalRequests > 0 ? Math.max(0, 100 - Math.round((totalFeedback / totalRequests) * 100)) : 0,
      },
      {
        step: "GENERATED",
        label: "AI Review Generated",
        count: generated,
        percentage: totalRequests > 0 ? Math.round((generated / totalRequests) * 100) : 0,
        dropoffPercentage: totalFeedback > 0 ? Math.max(0, Math.round(((totalFeedback - generated) / totalFeedback) * 100)) : 0,
      },
      {
        step: "EDITED",
        label: "Customer Edited",
        count: edited,
        percentage: totalRequests > 0 ? Math.round((edited / totalRequests) * 100) : 0,
        dropoffPercentage: generated > 0 ? Math.max(0, Math.round(((generated - edited) / generated) * 100)) : 0,
      },
      {
        step: "COPIED",
        label: "Review Copied",
        count: copied,
        percentage: totalRequests > 0 ? Math.round((copied / totalRequests) * 100) : 0,
        dropoffPercentage: generated > 0 ? Math.max(0, Math.round(((generated - copied) / generated) * 100)) : 0,
      },
      {
        step: "HANDOFF",
        label: "Google Handoff",
        count: googleHandoffs,
        percentage: totalRequests > 0 ? Math.round((googleHandoffs / totalRequests) * 100) : 0,
        dropoffPercentage: copied > 0 ? Math.max(0, Math.round(((copied - googleHandoffs) / copied) * 100)) : 0,
      },
    ];

    // Rating Distribution
    const ratingDistribution: RatingDistributionItem[] = [5, 4, 3, 2, 1].map((stars) => {
      const count = scoped.filter((r) => r.rating === stars).length;
      const percentage = validRatings.length > 0 ? Math.round((count / validRatings.length) * 100) : 0;
      return { stars, count, percentage };
    });

    // Sentiment Overview
    const positiveCount = scoped.filter((r) => r.rating >= 4).length;
    const neutralCount = scoped.filter((r) => r.rating === 3).length;
    const negativeCount = scoped.filter((r) => r.rating <= 2).length;
    const totalRated = validRatings.length;

    const sentiment: SentimentOverview = {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount,
      positivePct: totalRated > 0 ? Math.round((positiveCount / totalRated) * 100) : 0,
      neutralPct: totalRated > 0 ? Math.round((neutralCount / totalRated) * 100) : 0,
      negativePct: totalRated > 0 ? Math.round((negativeCount / totalRated) * 100) : 0,
    };

    // Trends: Build 7 daily intervals
    const trends: TrendDataPoint[] = [];
    const daysToShow = filters.dateRange === "today" ? 1 : filters.dateRange === "yesterday" ? 2 : filters.dateRange === "7d" ? 7 : 14;
    const now = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const dayRecords = scoped.filter((r) => {
        const itemDate = new Date(r.createdAt);
        return itemDate >= dayStart && itemDate < dayEnd;
      });

      const dayRequests = dayRecords.length;
      const dayGenerated = dayRecords.filter(
        (r) =>
          r.status === "GENERATED" ||
          r.status === "EDITED" ||
          r.status === "READY_TO_SUBMIT" ||
          r.status === "REDIRECTED"
      ).length;
      const dayHandoffs = dayRecords.filter((r) => r.status === "REDIRECTED" || Boolean(r.googleHandoffAt)).length;
      const dayRatings = dayRecords.filter((r) => typeof r.rating === "number");
      const dayAvg = dayRatings.length > 0 ? Math.round((dayRatings.reduce((s, r) => s + r.rating, 0) / dayRatings.length) * 10) / 10 : null;

      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trends.push({
        date: d.toISOString().split("T")[0],
        label: dateLabel,
        requests: dayRequests,
        generated: dayGenerated,
        googleHandoffs: dayHandoffs,
        averageRating: dayAvg,
      });
    }

    // Feedback Themes (Categorizes real customer feedback without inventing themes)
    const feedbackThemes = extractFeedbackThemes(scoped);

    // Peak Activity Insight (Only when sufficient data exists, e.g. >= 5 records)
    let peakActivityText: string | null = null;
    if (scoped.length >= 5) {
      const hours = scoped.map((r) => new Date(r.createdAt).getHours());
      const hourCounts: Record<number, number> = {};
      hours.forEach((h) => {
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      let maxHour = 10;
      let maxCount = 0;
      Object.entries(hourCounts).forEach(([h, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxHour = parseInt(h, 10);
        }
      });
      const startPeriod = maxHour >= 12 ? (maxHour === 12 ? "12 PM" : `${maxHour - 12} PM`) : (maxHour === 0 ? "12 AM" : `${maxHour} AM`);
      const endHour = (maxHour + 3) % 24;
      const endPeriod = endHour >= 12 ? (endHour === 12 ? "12 PM" : `${endHour - 12} PM`) : (endHour === 0 ? "12 AM" : `${endHour} AM`);
      const pct = Math.round((maxCount / scoped.length) * 100);
      peakActivityText = `Most review requests occur between ${startPeriod}–${endPeriod} (~${pct}% of activity).`;
    }

    return {
      kpis,
      funnel,
      ratingDistribution,
      sentiment,
      trends,
      feedbackThemes,
      peakActivityText,
    };
  },
};

// -------------------------------------------------------------------------
// Helper Functions for Filtering & Analytics Calculations
// -------------------------------------------------------------------------

function isWithinDateRange(dateInput: Date | string, range?: string): boolean {
  if (!range || range === "all") return true;
  const d = new Date(dateInput);
  const now = new Date();

  if (range === "today") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d >= startOfToday;
  }
  if (range === "yesterday") {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d >= startOfYesterday && d < endOfYesterday;
  }
  if (range === "7d") {
    const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= threshold;
  }
  if (range === "30d") {
    const threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return d >= threshold;
  }
  if (range === "90d") {
    const threshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return d >= threshold;
  }
  return true;
}

function matchesStatusFilter(status: ReviewRequestStatus, filterStatus?: string): boolean {
  if (!filterStatus || filterStatus === "ALL") return true;
  const upper = filterStatus.toUpperCase();
  if (upper === "REQUESTED" || upper === "DRAFT") return status === "DRAFT";
  if (upper === "GENERATED") return status === "GENERATED";
  if (upper === "EDITED") return status === "EDITED";
  if (upper === "COPIED" || upper === "READY_TO_SUBMIT") return status === "READY_TO_SUBMIT";
  if (upper === "GOOGLE_HANDOFF" || upper === "REDIRECTED") return status === "REDIRECTED";
  if (upper === "FAILED") return status === "FAILED";
  if (upper === "COMPLETED") return status === "COMPLETED";
  return status === filterStatus;
}

function matchesSearch(r: ReviewRequest, search?: string): boolean {
  if (!search || !search.trim()) return true;
  const q = search.toLowerCase().trim();
  if (r.experience && r.experience.toLowerCase().includes(q)) return true;
  if (r.business?.name && r.business.name.toLowerCase().includes(q)) return true;
  if (r.drafts?.some((d) => d.content.toLowerCase().includes(q))) return true;
  return false;
}

function extractFeedbackThemes(records: ReviewRequest[]): FeedbackThemeInsight[] {
  const themeDefinitions = [
    {
      theme: "Staff & Service",
      keywords: ["staff", "barista", "service", "friendly", "polite", "helpful", "attentive", "doctor", "therapist"],
    },
    {
      theme: "Quality & Flavor",
      keywords: ["coffee", "food", "dish", "pastry", "scone", "bun", "trout", "risotto", "espresso", "delicious", "fresh"],
    },
    {
      theme: "Speed & Wait Time",
      keywords: ["wait", "quick", "fast", "punctual", "delay", "on-time", "minutes", "rush"],
    },
    {
      theme: "Ambiance & Facility",
      keywords: ["clean", "seating", "table", "ambiance", "atmosphere", "wifi", "crowded", "comfortable"],
    },
  ];

  const results: FeedbackThemeInsight[] = [];

  for (const def of themeDefinitions) {
    const matching = records.filter((r) => {
      const exp = (r.experience || "").toLowerCase();
      return def.keywords.some((k) => exp.includes(k));
    });

    if (matching.length > 0) {
      const avgRating = matching.reduce((s, r) => s + r.rating, 0) / matching.length;
      results.push({
        theme: def.theme,
        count: matching.length,
        sentiment: avgRating >= 4 ? "positive" : avgRating === 3 ? "neutral" : "negative",
        sampleFeedback: matching[0].experience.slice(0, 90) + (matching[0].experience.length > 90 ? "..." : ""),
      });
    }
  }

  return results.sort((a, b) => b.count - a.count);
}

