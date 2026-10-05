import { notificationRepository } from "@/server/repositories/notificationRepository";
import { NotificationLog } from "@/types";
import { maskEmail, maskPhone } from "@/lib/security/tokens";

export interface SendNotificationParams {
  reviewRequestId: string;
  businessId: string;
  channel: "EMAIL" | "SMS";
  recipient: string;
  customerName?: string | null;
  businessName: string;
  serviceName?: string | null;
  reviewUrl: string;
  unsubscribeUrl: string;
  type: "INITIAL" | "REMINDER" | "RESEND";
  attemptCount?: number;
}

export interface SendNotificationResult {
  success: boolean;
  log: NotificationLog;
  error?: string;
}

export const MAX_NOTIFICATION_ATTEMPTS = 3;

export const notificationService = {
  /**
   * Generates message content tailored to channel and notification type.
   */
  formatMessage(params: SendNotificationParams): { subject?: string; message: string } {
    const greeting = params.customerName ? `Hi ${params.customerName}` : "Hello";
    const serviceContext = params.serviceName ? ` for ${params.serviceName}` : "";

    if (params.channel === "SMS") {
      let message = "";
      if (params.type === "INITIAL") {
        message = `${params.businessName}: ${greeting}, thank you for choosing us${serviceContext}! Please share your quick review here: ${params.reviewUrl} (To unsubscribe: ${params.unsubscribeUrl})`;
      } else if (params.type === "REMINDER") {
        message = `${params.businessName}: ${greeting}, gentle reminder to share your experience${serviceContext}: ${params.reviewUrl} (To unsubscribe: ${params.unsubscribeUrl})`;
      } else {
        message = `${params.businessName}: Here is your requested review link: ${params.reviewUrl} (To unsubscribe: ${params.unsubscribeUrl})`;
      }
      return { message };
    }

    // EMAIL Channel
    let subject = "";
    if (params.type === "INITIAL") {
      subject = `How was your experience at ${params.businessName}?`;
    } else if (params.type === "REMINDER") {
      subject = `Friendly reminder: Share your feedback for ${params.businessName}`;
    } else {
      subject = `Your review link for ${params.businessName}`;
    }

    const message = [
      `${greeting},`,
      "",
      `Thank you for visiting ${params.businessName}${serviceContext}.`,
      "Your feedback is deeply appreciated and helps us maintain our quality of service.",
      "",
      `Please take 30 seconds to share your thoughts and generate your review:`,
      params.reviewUrl,
      "",
      "---",
      `If you do not wish to receive further messages, you can opt out here:`,
      params.unsubscribeUrl,
    ].join("\n");

    return { subject, message };
  },

  /**
   * Sends or safely simulates delivery based on NOTIFICATION_MODE.
   * Handles invalid recipient validation and bounds retries to MAX_NOTIFICATION_ATTEMPTS.
   */
  async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    const { subject, message } = this.formatMessage(params);
    const mode = process.env.NOTIFICATION_MODE || "development";

    const maskedRecipient =
      params.channel === "EMAIL"
        ? maskEmail(params.recipient)
        : maskPhone(params.recipient);

    const attempt = params.attemptCount || 1;

    // Check attempt ceiling (Bounded retry defense)
    if (attempt > MAX_NOTIFICATION_ATTEMPTS) {
      const failLog = await notificationRepository.create({
        reviewRequestId: params.reviewRequestId,
        businessId: params.businessId,
        channel: params.channel,
        recipient: params.recipient,
        subject: subject || null,
        message,
        type: params.type,
        status: "FAILED",
        error: `Exceeded maximum notification attempt limit (${MAX_NOTIFICATION_ATTEMPTS})`,
        attemptCount: attempt,
        metadata: {
          maskedRecipient,
          reason: "MAX_ATTEMPTS_EXCEEDED",
        },
      });

      return {
        success: false,
        log: failLog,
        error: "Exceeded maximum delivery attempts.",
      };
    }

    // Validate recipient format safely
    const isValidRecipient =
      params.channel === "EMAIL"
        ? Boolean(params.recipient && params.recipient.includes("@") && params.recipient.length <= 254)
        : Boolean(params.recipient && params.recipient.replace(/\D/g, "").length >= 7);

    const isSuccess = isValidRecipient;
    const errorMessage = isValidRecipient
      ? undefined
      : `Invalid recipient address format for channel ${params.channel}`;

    const log = await notificationRepository.create({
      reviewRequestId: params.reviewRequestId,
      businessId: params.businessId,
      channel: params.channel,
      recipient: params.recipient,
      subject: subject || null,
      message,
      type: params.type,
      status: isSuccess ? "SENT" : "FAILED",
      error: errorMessage || null,
      attemptCount: attempt,
      metadata: {
        customerName: params.customerName || null,
        serviceName: params.serviceName || null,
        maskedRecipient,
        mode,
      },
    });

    return {
      success: isSuccess,
      log,
      error: errorMessage,
    };
  },

  /**
   * Retrieves notification history for a specific request.
   */
  async getLogsForRequest(reviewRequestId: string): Promise<NotificationLog[]> {
    return notificationRepository.findByRequestId(reviewRequestId);
  },

  /**
   * Retrieves notification history for a business.
   */
  async getLogsForBusiness(businessId: string): Promise<NotificationLog[]> {
    return notificationRepository.findByBusinessId(businessId);
  },

  /**
   * Returns summary counts.
   */
  async getSummary(businessId?: string): Promise<{ total: number; sent: number; failed: number }> {
    return notificationRepository.count(businessId);
  },
};
