import { reviewRepository } from "@/server/repositories/reviewRepository";
import { businessRepository } from "@/server/repositories/businessRepository";
import { activityRepository } from "@/server/repositories/activityRepository";
import { automationRepository } from "@/server/repositories/automationRepository";
import { notificationService } from "@/server/services/notificationService";
import {
  generateSecureToken,
  buildReviewUrl,
  buildUnsubscribeUrl,
  isTokenExpired,
} from "@/lib/security/tokens";
import { sanitizeText } from "@/lib/security/sanitization";
import {
  AutomationSettings,
  CreateManualRequestInput,
  ReviewRequest,
  ServiceCompletionEvent,
} from "@/types";

const activeEventLocks = new Set<string>();

export const automationService = {
  /**
   * Retrieves automation settings for a business.
   */
  async getSettings(businessId: string): Promise<AutomationSettings> {
    return automationRepository.getSettings(businessId);
  },

  /**
   * Updates automation settings for a business.
   */
  async updateSettings(
    businessId: string,
    updates: Partial<AutomationSettings>,
    actorId?: string
  ): Promise<AutomationSettings> {
    const updated = await automationRepository.updateSettings(businessId, updates);

    await activityRepository.log({
      actorId,
      action: "AUTOMATION_SETTINGS_UPDATED",
      entityType: "AutomationSettings",
      entityId: businessId,
      metadata: {
        businessId,
        enabled: updated.enabled,
        channel: updated.channel,
        remindersEnabled: updated.remindersEnabled,
        maxReminders: updated.maxReminders,
      },
    });

    return updated;
  },

  /**
   * Core Milestone 5 Trigger: Service Completion Event.
   * Features: Duplicate/Idempotency Protection, Delay scheduling, Token generation, Notification dispatch.
   */
  async triggerServiceCompletion(event: ServiceCompletionEvent): Promise<{
    success: boolean;
    isDuplicate?: boolean;
    request: ReviewRequest;
    notificationSent: boolean;
    message?: string;
  }> {
    // 1. Duplicate & Idempotency Protection (Acquire lock synchronously before any async operations)
    const lockKey = `${event.businessId}:${event.serviceId || event.customerEmail || event.customerPhone}`;
    if (activeEventLocks.has(lockKey)) {
      const existing = await reviewRepository.findAll({ businessId: event.businessId });
      const duplicate = existing.find((r) => r.serviceId === event.serviceId) || existing[0];
      return {
        success: true,
        isDuplicate: true,
        request: duplicate || ({ id: "concurrent-dup", businessId: event.businessId } as unknown as ReviewRequest),
        notificationSent: false,
        message: "A concurrent request for this service event is already being processed.",
      };
    }

    activeEventLocks.add(lockKey);
    try {
      if (!event.businessId) {
        throw new Error("businessId is required for service completion");
      }
      if (!event.customerName?.trim()) {
        throw new Error("customerName is required");
      }
      if (!event.customerEmail?.trim() && !event.customerPhone?.trim()) {
        throw new Error("At least one contact method (email or phone) is required");
      }

      const business = await businessRepository.findById(event.businessId);
      if (!business) {
        throw new Error(`Business not found for ID: ${event.businessId}`);
      }

      // Check if an active request already exists for this business + serviceId
      if (event.serviceId) {
        const existing = await reviewRepository.findAll({ businessId: event.businessId });
        const duplicate = existing.find(
          (r) =>
            r.serviceId === event.serviceId &&
            r.status !== "CANCELLED" &&
            r.status !== "EXPIRED"
        );
        if (duplicate) {
          return {
            success: true,
            isDuplicate: true,
            request: duplicate,
            notificationSent: false,
            message: "A review request for this service completion event already exists.",
          };
        }
      }

    // 2. Fetch business automation settings
    const settings = await automationRepository.getSettings(event.businessId);

    // 3. Determine channel
    let channel: "EMAIL" | "SMS" = "EMAIL";
    if (event.channel) {
      channel = event.channel;
    } else if (settings.channel === "SMS") {
      channel = event.customerPhone ? "SMS" : "EMAIL";
    } else if (settings.channel === "BOTH") {
      channel = event.customerEmail ? "EMAIL" : "SMS";
    } else {
      channel = event.customerEmail ? "EMAIL" : "SMS";
    }

    const recipient = channel === "EMAIL" ? event.customerEmail : event.customerPhone;
    if (!recipient) {
      throw new Error(`Recipient contact missing for selected channel: ${channel}`);
    }

    // 4. Generate secure token & expiration
    const token = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + settings.expirationDays * 24 * 60 * 60 * 1000);
    const delayMinutes = event.delayMinutes ?? settings.delayMinutes;
    const isScheduled = delayMinutes > 0;
    const scheduledAt = isScheduled ? new Date(Date.now() + delayMinutes * 60 * 1000) : null;
    const sentAt = isScheduled ? null : new Date();

    // 5. Create Review Request record
    const newRequest = await reviewRepository.create({
      businessId: event.businessId,
      customerName: sanitizeText(event.customerName),
      customerEmail: event.customerEmail ? sanitizeText(event.customerEmail) : null,
      customerPhone: event.customerPhone ? sanitizeText(event.customerPhone) : null,
      serviceId: event.serviceId ? sanitizeText(event.serviceId) : null,
      serviceName: event.serviceName ? sanitizeText(event.serviceName) : null,
      requestToken: token,
      channel,
      experience: "",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: !settings.enabled ? "CREATED" : isScheduled ? "SCHEDULED" : "SENT",
      scheduledAt,
      sentAt,
      expiresAt,
      reminderCount: 0,
      optedOut: false,
    });

    // 6. Log Service Completed Activity
    await activityRepository.log({
      action: "SERVICE_COMPLETED",
      entityType: "ReviewRequest",
      entityId: newRequest.id,
      metadata: {
        businessId: event.businessId,
        businessName: business.name,
        serviceId: event.serviceId,
        serviceName: event.serviceName,
        customerName: event.customerName,
      },
    });

    // 7. If automation is disabled, stop here safely
    if (!settings.enabled) {
      return {
        success: true,
        request: newRequest,
        notificationSent: false,
        message: "Service recorded. Automation is disabled for this business.",
      };
    }

    // 8. If scheduled for later, record activity and return
    if (isScheduled) {
      await activityRepository.log({
        action: "REVIEW_REQUEST_SCHEDULED",
        entityType: "ReviewRequest",
        entityId: newRequest.id,
        metadata: {
          scheduledAt,
          delayMinutes,
        },
      });
      return {
        success: true,
        request: newRequest,
        notificationSent: false,
        message: `Review request scheduled to send in ${delayMinutes} minutes.`,
      };
    }

    // 9. Dispatch immediate notification
    const reviewUrl = buildReviewUrl(token);
    const unsubscribeUrl = buildUnsubscribeUrl(token);

    const notifResult = await notificationService.send({
      reviewRequestId: newRequest.id,
      businessId: event.businessId,
      channel,
      recipient,
      customerName: event.customerName,
      businessName: business.name,
      serviceName: event.serviceName,
      reviewUrl,
      unsubscribeUrl,
      type: "INITIAL",
    });

    if (notifResult.success) {
      await activityRepository.log({
        action: "REVIEW_REQUEST_SENT",
        entityType: "ReviewRequest",
        entityId: newRequest.id,
        metadata: {
          channel,
          notificationId: notifResult.log.id,
        },
      });
    }

      return {
        success: true,
        request: newRequest,
        notificationSent: notifResult.success,
        message: notifResult.success
          ? "Review request sent successfully."
          : "Failed to dispatch notification.",
      };
    } finally {
      activeEventLocks.delete(lockKey);
    }
  },

  /**
   * Manual Request Creation triggered by an Operator/Admin.
   */
  async createManualRequest(
    input: CreateManualRequestInput,
    actorId?: string
  ): Promise<{ success: boolean; request: ReviewRequest; notificationSent: boolean }> {
    if (!input.businessId) throw new Error("businessId is required");
    if (!input.customerName?.trim()) throw new Error("customerName is required");

    const business = await businessRepository.findById(input.businessId);
    if (!business) throw new Error(`Business not found: ${input.businessId}`);

    const recipient = input.channel === "EMAIL" ? input.customerEmail : input.customerPhone;
    if (!recipient?.trim()) {
      throw new Error(`Contact information required for channel ${input.channel}`);
    }

    const settings = await automationRepository.getSettings(input.businessId);
    const token = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + settings.expirationDays * 24 * 60 * 60 * 1000);
    const shouldSend = input.sendImmediately !== false;

    const request = await reviewRepository.create({
      businessId: input.businessId,
      customerName: sanitizeText(input.customerName),
      customerEmail: input.customerEmail ? sanitizeText(input.customerEmail) : null,
      customerPhone: input.customerPhone ? sanitizeText(input.customerPhone) : null,
      serviceName: input.serviceName ? sanitizeText(input.serviceName) : null,
      requestToken: token,
      channel: input.channel,
      experience: input.initialExperience ? sanitizeText(input.initialExperience) : "",
      rating: input.initialRating ?? 5,
      language: "en",
      tone: "authentic",
      status: shouldSend ? "SENT" : "CREATED",
      sentAt: shouldSend ? new Date() : null,
      expiresAt,
      reminderCount: 0,
      optedOut: false,
    });

    await activityRepository.log({
      actorId,
      action: "REVIEW_REQUEST_CREATED",
      entityType: "ReviewRequest",
      entityId: request.id,
      metadata: {
        businessId: input.businessId,
        channel: input.channel,
        customerName: input.customerName,
        manual: true,
      },
    });

    let notificationSent = false;
    if (shouldSend) {
      const reviewUrl = buildReviewUrl(token);
      const unsubscribeUrl = buildUnsubscribeUrl(token);

      const res = await notificationService.send({
        reviewRequestId: request.id,
        businessId: input.businessId,
        channel: input.channel,
        recipient,
        customerName: input.customerName,
        businessName: business.name,
        serviceName: input.serviceName,
        reviewUrl,
        unsubscribeUrl,
        type: "INITIAL",
      });

      notificationSent = res.success;
      if (res.success) {
        await activityRepository.log({
          actorId,
          action: "REVIEW_REQUEST_SENT",
          entityType: "ReviewRequest",
          entityId: request.id,
          metadata: {
            channel: input.channel,
            manual: true,
          },
        });
      }
    }

    return {
      success: true,
      request,
      notificationSent,
    };
  },

  /**
   * Resend notification with 2-minute cooldown protection.
   */
  async resendNotification(
    reviewRequestId: string,
    actorId?: string
  ): Promise<{ success: boolean; message: string }> {
    const request = await reviewRepository.findById(reviewRequestId);
    if (!request) {
      throw new Error("Review request not found");
    }

    if (request.status === "CANCELLED") {
      throw new Error("Cannot resend notification for a cancelled request.");
    }
    if (request.optedOut) {
      throw new Error("Cannot resend notification: customer has opted out.");
    }
    if (isTokenExpired(request.expiresAt)) {
      throw new Error("Cannot resend notification: this review link has expired.");
    }

    const business = await businessRepository.findById(request.businessId);
    if (!business) {
      throw new Error("Associated business not found");
    }

    // Cooldown check: minimum 2 minutes (120,000 ms) between notification dispatches
    const logs = await notificationService.getLogsForRequest(reviewRequestId);
    if (logs.length > 0) {
      const lastSentTime = new Date(logs[0].createdAt).getTime();
      const elapsedMs = Date.now() - lastSentTime;
      const cooldownMs = 2 * 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw new Error(
          `Please wait ${remainingSec} seconds before resending a notification (cooldown active).`
        );
      }
    }

    const channel: "EMAIL" | "SMS" = request.channel === "SMS" ? "SMS" : "EMAIL";
    const recipient = channel === "EMAIL" ? request.customerEmail : request.customerPhone;
    if (!recipient) {
      throw new Error(`Customer contact not available for channel ${channel}`);
    }

    const token = request.requestToken || generateSecureToken(24);
    if (!request.requestToken) {
      await reviewRepository.updateRequest(request.id, { requestToken: token });
    }

    const reviewUrl = buildReviewUrl(token);
    const unsubscribeUrl = buildUnsubscribeUrl(token);

    const res = await notificationService.send({
      reviewRequestId: request.id,
      businessId: request.businessId,
      channel,
      recipient,
      customerName: request.customerName,
      businessName: business.name,
      serviceName: request.serviceName,
      reviewUrl,
      unsubscribeUrl,
      type: "RESEND",
    });

    if (!res.success) {
      throw new Error("Failed to deliver resend notification.");
    }

    await reviewRepository.updateRequest(request.id, {
      status: request.status === "CREATED" ? "SENT" : request.status,
      sentAt: new Date(),
    });

    await activityRepository.log({
      actorId,
      action: "REVIEW_REQUEST_SENT",
      entityType: "ReviewRequest",
      entityId: request.id,
      metadata: {
        type: "RESEND",
        channel,
      },
    });

    return {
      success: true,
      message: "Notification resent successfully.",
    };
  },

  /**
   * Automated reminder processor.
   * Safety rules: Never sends if completed, opted out, cancelled, expired, max reminders reached, or interval not elapsed.
   */
  async processReminders(options?: {
    businessId?: string;
    forceEligible?: boolean; // Used for automated testing
  }): Promise<{ checked: number; sent: number; skipped: number }> {
    const allRequests = await reviewRepository.findAll(
      options?.businessId ? { businessId: options.businessId } : undefined
    );

    let sent = 0;
    let skipped = 0;

    for (const req of allRequests) {
      // 1. Safety: Do not send if terminal or completed
      if (
        req.status === "COMPLETED" ||
        req.status === "REDIRECTED" ||
        req.status === "READY_TO_SUBMIT" ||
        req.status === "CANCELLED" ||
        req.status === "EXPIRED"
      ) {
        skipped++;
        continue;
      }

      // 2. Safety: Do not send if opted out
      if (req.optedOut) {
        skipped++;
        continue;
      }

      // 3. Safety: Do not send if expired
      if (isTokenExpired(req.expiresAt)) {
        skipped++;
        continue;
      }

      // 4. Fetch business automation settings
      const settings = await automationRepository.getSettings(req.businessId);
      if (!settings.enabled || !settings.remindersEnabled) {
        skipped++;
        continue;
      }

      // 5. Safety: Do not exceed max reminders
      const currentReminders = req.reminderCount || 0;
      if (currentReminders >= settings.maxReminders) {
        skipped++;
        continue;
      }

      // 6. Check interval elapsed
      const lastInteraction = req.lastReminderAt
        ? new Date(req.lastReminderAt).getTime()
        : req.sentAt
        ? new Date(req.sentAt).getTime()
        : new Date(req.createdAt).getTime();

      const elapsedHours = (Date.now() - lastInteraction) / (1000 * 60 * 60);

      if (!options?.forceEligible && elapsedHours < settings.reminderIntervalHours) {
        skipped++;
        continue;
      }

      // Eligible for reminder!
      const business = await businessRepository.findById(req.businessId);
      if (!business) {
        skipped++;
        continue;
      }

      const channel: "EMAIL" | "SMS" = req.channel === "SMS" ? "SMS" : "EMAIL";
      const recipient = channel === "EMAIL" ? req.customerEmail : req.customerPhone;
      if (!recipient) {
        skipped++;
        continue;
      }

      const token = req.requestToken || generateSecureToken(24);
      const reviewUrl = buildReviewUrl(token);
      const unsubscribeUrl = buildUnsubscribeUrl(token);

      const notifRes = await notificationService.send({
        reviewRequestId: req.id,
        businessId: req.businessId,
        channel,
        recipient,
        customerName: req.customerName,
        businessName: business.name,
        serviceName: req.serviceName,
        reviewUrl,
        unsubscribeUrl,
        type: "REMINDER",
      });

      if (notifRes.success) {
        await reviewRepository.updateRequest(req.id, {
          reminderCount: currentReminders + 1,
          lastReminderAt: new Date(),
        });

        await activityRepository.log({
          action: "REMINDER_SENT",
          entityType: "ReviewRequest",
          entityId: req.id,
          metadata: {
            reminderIndex: currentReminders + 1,
            channel,
          },
        });
        sent++;
      } else {
        skipped++;
      }
    }

    return {
      checked: allRequests.length,
      sent,
      skipped,
    };
  },

  /**
   * Cancels a review request.
   */
  async cancelRequest(
    reviewRequestId: string,
    actorId?: string
  ): Promise<{ success: boolean; message: string }> {
    const req = await reviewRepository.findById(reviewRequestId);
    if (!req) throw new Error("Review request not found");

    await reviewRepository.updateStatus(reviewRequestId, "CANCELLED");

    await activityRepository.log({
      actorId,
      action: "REQUEST_CANCELLED",
      entityType: "ReviewRequest",
      entityId: reviewRequestId,
      metadata: {
        businessId: req.businessId,
      },
    });

    return { success: true, message: "Review request cancelled." };
  },

  /**
   * Resolves a customer review token and records the link opening.
   */
  async resolveRequestByToken(token: string): Promise<{
    valid: boolean;
    reason?: "NOT_FOUND" | "EXPIRED" | "CANCELLED" | "OPTED_OUT";
    request?: ReviewRequest;
  }> {
    if (!token) return { valid: false, reason: "NOT_FOUND" };

    const request = await reviewRepository.findByToken(token);
    if (!request) {
      return { valid: false, reason: "NOT_FOUND" };
    }

    if (request.optedOut) {
      return { valid: false, reason: "OPTED_OUT", request };
    }

    if (request.status === "CANCELLED") {
      return { valid: false, reason: "CANCELLED", request };
    }

    if (isTokenExpired(request.expiresAt)) {
      await reviewRepository.updateStatus(request.id, "EXPIRED");
      return { valid: false, reason: "EXPIRED", request };
    }

    // Record opening
    const wasAlreadyOpened = Boolean(request.openedAt);
    const updated = await reviewRepository.recordOpened(token);

    if (!wasAlreadyOpened && updated) {
      await activityRepository.log({
        action: "REVIEW_REQUEST_OPENED",
        entityType: "ReviewRequest",
        entityId: updated.id,
        metadata: {
          businessId: updated.businessId,
        },
      });
    }

    return {
      valid: true,
      request: updated || request,
    };
  },

  /**
   * Opts out customer from future notifications.
   */
  async optOutCustomer(token: string): Promise<{ success: boolean; message: string }> {
    const request = await reviewRepository.findByToken(token);
    if (!request) {
      return { success: false, message: "Invalid or unknown review link token." };
    }

    await reviewRepository.recordOptOut(token);

    await activityRepository.log({
      action: "CUSTOMER_OPTED_OUT",
      entityType: "ReviewRequest",
      entityId: request.id,
      metadata: {
        businessId: request.businessId,
      },
    });

    return {
      success: true,
      message: "You have been successfully unsubscribed from review communications.",
    };
  },
};
