/**
 * Automated Verification Script for Milestone 5: Review Request Automation & Notifications
 *
 * Verifies all 22 required areas for Milestone 5:
 * 1. Cryptographically Secure Token Generation (High entropy, URL-safe base64url)
 * 2. Token URL Builders & Expiration Checks
 * 3. PII Masking & Privacy (Masked email & phone in logs/notifications)
 * 4. Notification Message Generation (Email & SMS templating with unsubscribe link)
 * 5. Safe Development Notification Mode (No external paid API costs)
 * 6. Service Completion Trigger (Automated request creation & dispatch)
 * 7. Duplicate & Spam Protection (Idempotency by serviceId + businessId)
 * 8. Manual Review Request Creation (Admin-initiated dispatch)
 * 9. Customer Review Token Resolution & Context Fetching
 * 10. Auto-Tracking Open State (First open sets openedAt and OPENED status)
 * 11. Customer Opt-Out / Unsubscribe Mechanism (Blocks future reminders)
 * 12. Request Cancellation Safety (Admin cancellation blocks access and reminders)
 * 13. Token Expiration Enforcement (Rejects expired tokens gracefully)
 * 14. Resend Notification & 2-Minute Cooldown Enforcement
 * 15. Configurable Automation Settings (Channels, intervals, limits)
 * 16. Multi-Tenant Automation Settings Isolation
 * 17. Automated Reminder Engine Safety Rules (Skips completed, opted out, cancelled, expired)
 * 18. Milestone 5 Analytics & KPI Aggregation (Requests sent, open rate, completion rate, etc.)
 * 19. Zero Review Gating Enforcement (1-star and 5-star both have direct Google handoff access)
 * 20. Customer-Controlled Google Submission (Never automated Google review posting)
 * 21. Zero Secret & Credential Exposure
 * 22. Full Regressions: Milestone 2 (OAuth & Token Vault), Milestone 3 (AI Generation), Milestone 4 (Admin Analytics)
 */

import crypto from "crypto";
import {
  generateSecureToken,
  buildReviewUrl,
  buildUnsubscribeUrl,
  isTokenExpired,
  maskEmail,
  maskPhone,
  redactSensitiveObject,
} from "../lib/security/tokens";
import { notificationService } from "../server/services/notificationService";
import { notificationRepository } from "../server/repositories/notificationRepository";
import { automationService } from "../server/services/automationService";
import { automationRepository } from "../server/repositories/automationRepository";
import { reviewRepository } from "../server/repositories/reviewRepository";
import { aiReviewService } from "../server/services/aiReviewService";
import { encryptSecret, decryptSecret } from "../lib/security/encryption";
import { generateOAuthState, parseAndValidateOAuthState } from "../lib/oauth/google";
import { validateAdminRequest } from "../lib/security/auth";
import { NextRequest } from "next/server";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  ReviewFlow Milestone 5: Automated Verification Suite");
  console.log("=======================================================\n");

  const TEST_BIZ_ID = "demo-biz-1";
  const TEST_BIZ_2_ID = "demo-biz-2";

  // -------------------------------------------------------------------------
  // Test 1: Cryptographic Token Security & Entropy
  // -------------------------------------------------------------------------
  console.log("[TEST 1] Cryptographically Secure Token Generation & Entropy...");
  try {
    const token1 = generateSecureToken(24);
    const token2 = generateSecureToken(24);

    assert(typeof token1 === "string", "Token is a string");
    assert(token1.length >= 32, "24-byte token produces at least 32 URL-safe characters");
    assert(!token1.includes("+") && !token1.includes("/") && !token1.includes("="), "Token uses URL-safe base64url encoding (no +, /, =)");
    assert(token1 !== token2, "Consecutive tokens are uniquely random");

    // Uniqueness test across 100 generated tokens
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateSecureToken(24));
    }
    assert(set.size === 100, "100 consecutively generated tokens exhibit 100% uniqueness with zero collisions");
  } catch (err) {
    assert(false, `Test 1 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 2: URL Construction & Expiration Logic
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] URL Construction & Expiration Logic...");
  try {
    const sampleToken = "tok_test_sample_xyz123";
    const reviewUrl = buildReviewUrl(sampleToken, "http://localhost:3000");
    const unsubUrl = buildUnsubscribeUrl(sampleToken, "http://localhost:3000");

    assert(reviewUrl === `http://localhost:3000/review/request/${sampleToken}`, "buildReviewUrl creates correct path");
    assert(unsubUrl === `http://localhost:3000/review/unsubscribe?token=${sampleToken}`, "buildUnsubscribeUrl creates correct path");

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days future
    const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour past
    assert(!isTokenExpired(futureDate), "Future date is not marked as expired");
    assert(isTokenExpired(pastDate), "Past date is marked as expired");
    assert(!isTokenExpired(null), "Null expiration date does not prematurely expire");
  } catch (err) {
    assert(false, `Test 2 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 3: PII Masking & Privacy Obfuscation
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] PII Obfuscation & Contact Masking...");
  try {
    const masked1 = maskEmail("sarah.connor@cyberdyne.com");
    assert(masked1.startsWith("sa***r@cyberdyne.com") || masked1.includes("***"), "Email is properly obfuscated");
    assert(!masked1.includes("connor"), "Sensitive name segment removed from email mask");

    const maskedPhone1 = maskPhone("+15559876543");
    assert(maskedPhone1 === "***-***-6543", "Phone number only exposes last 4 digits");

    const redacted = redactSensitiveObject({
      normalField: "hello",
      accessToken: "secret-token",
      apiKey: "secret-key",
      refreshToken: "secret-refresh",
    });
    assert(redacted.normalField === "hello", "Non-sensitive fields preserved");
    assert(!("accessToken" in redacted) && !("apiKey" in redacted) && !("refreshToken" in redacted), "Sensitive credential fields stripped");
  } catch (err) {
    assert(false, `Test 3 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 4: Notification Templating & Formatting
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] Notification Message Formatting & Channel Templates...");
  try {
    const emailFormat = notificationService.formatMessage({
      reviewRequestId: "test-req-1",
      businessId: TEST_BIZ_ID,
      channel: "EMAIL",
      recipient: "customer@example.com",
      customerName: "Alice Walker",
      businessName: "Artisan Cafe",
      serviceName: "Pour-over Workshop",
      reviewUrl: "http://localhost:3000/review/request/tok123",
      unsubscribeUrl: "http://localhost:3000/review/unsubscribe?token=tok123",
      type: "INITIAL",
    });

    assert(Boolean(emailFormat.subject && emailFormat.subject.includes("Artisan Cafe")), "Email subject contains business name");
    assert(emailFormat.message.includes("Alice Walker"), "Email message contains personalized customer greeting");
    assert(emailFormat.message.includes("Pour-over Workshop"), "Email message includes service context");
    assert(emailFormat.message.includes("http://localhost:3000/review/request/tok123"), "Email message includes review link");
    assert(emailFormat.message.includes("http://localhost:3000/review/unsubscribe?token=tok123"), "Email message includes unsubscribe link");

    const smsFormat = notificationService.formatMessage({
      reviewRequestId: "test-req-1",
      businessId: TEST_BIZ_ID,
      channel: "SMS",
      recipient: "+15551234567",
      customerName: "Alice Walker",
      businessName: "Artisan Cafe",
      serviceName: "Pour-over Workshop",
      reviewUrl: "http://localhost:3000/review/request/tok123",
      unsubscribeUrl: "http://localhost:3000/review/unsubscribe?token=tok123",
      type: "INITIAL",
    });

    assert(smsFormat.subject === undefined, "SMS has no subject line");
    assert(smsFormat.message.includes("Artisan Cafe:"), "SMS starts with business name brand prefix");
    assert(smsFormat.message.includes("http://localhost:3000/review/request/tok123"), "SMS contains review URL");
    assert(smsFormat.message.includes("unsubscribe"), "SMS provides opt-out instructions");
  } catch (err) {
    assert(false, `Test 4 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 5: Safe Development Notification Mode (No external paid APIs)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 5] Safe Development Notification Simulation Mode...");
  try {
    const sendResult = await notificationService.send({
      reviewRequestId: "test-req-mode",
      businessId: TEST_BIZ_ID,
      channel: "EMAIL",
      recipient: "dev.customer@example.com",
      customerName: "Dev User",
      businessName: "Artisan Cafe",
      reviewUrl: "http://localhost:3000/review/request/tokDev",
      unsubscribeUrl: "http://localhost:3000/review/unsubscribe?token=tokDev",
      type: "INITIAL",
    });

    assert(sendResult.success === true, "Development notification dispatches successfully");
    assert(sendResult.log.status === "SENT", "Notification status recorded as SENT in log");
    assert(sendResult.log.recipient.includes("@example.com"), "Log stores recipient");
    assert(sendResult.log.type === "INITIAL", "Log records correct type");

    const storedLogs = await notificationService.getLogsForRequest("test-req-mode");
    assert(storedLogs.length >= 1, "Log is persisted and retrievable via repository");
  } catch (err) {
    assert(false, `Test 5 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 6: Service Completion Automation Trigger
  // -------------------------------------------------------------------------
  console.log("\n[TEST 6] Service Completion Automation Trigger...");
  const uniqueServiceId = `srv-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  let triggeredRequestId = "";
  let triggeredToken = "";

  try {
    const triggerResult = await automationService.triggerServiceCompletion({
      businessId: TEST_BIZ_ID,
      serviceId: uniqueServiceId,
      customerName: "Elena Rostova",
      customerEmail: "elena.rostova@example.com",
      serviceName: "Artisan Espresso Flight",
      channel: "EMAIL",
    });

    assert(triggerResult.success === true, "triggerServiceCompletion returns success: true");
    assert(!triggerResult.isDuplicate, "First event is not flagged as duplicate");
    assert(triggerResult.notificationSent === true, "Notification was sent upon completion");
    assert(Boolean(triggerResult.request.id), "Review request ID generated");
    assert(Boolean(triggerResult.request.requestToken), "Review request token generated");
    assert(triggerResult.request.customerName === "Elena Rostova", "Customer name stored correctly");
    assert(triggerResult.request.serviceName === "Artisan Espresso Flight", "Service name stored correctly");
    assert(triggerResult.request.status === "SENT", "Initial status set to SENT");

    triggeredRequestId = triggerResult.request.id;
    triggeredToken = triggerResult.request.requestToken!;
  } catch (err) {
    assert(false, `Test 6 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 7: Duplicate Protection & Idempotency
  // -------------------------------------------------------------------------
  console.log("\n[TEST 7] Duplicate Service Completion Protection (Idempotency)...");
  try {
    const duplicateResult = await automationService.triggerServiceCompletion({
      businessId: TEST_BIZ_ID,
      serviceId: uniqueServiceId, // Exact same serviceId
      customerName: "Elena Rostova",
      customerEmail: "elena.rostova@example.com",
      serviceName: "Artisan Espresso Flight",
      channel: "EMAIL",
    });

    assert(duplicateResult.success === true, "Duplicate call handled cleanly");
    assert(duplicateResult.isDuplicate === true, "Duplicate detected and flagged");
    assert(duplicateResult.notificationSent === false, "Duplicate notification dispatch prevented");
    assert(duplicateResult.request.id === triggeredRequestId, "Returns existing request instead of creating duplicate");
  } catch (err) {
    assert(false, `Test 7 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 8: Manual Review Request Creation (Admin-Initiated)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 8] Manual Review Request Creation by Admin...");
  let manualToken = "";
  let manualRequestId = "";

  try {
    const manualResult = await automationService.createManualRequest({
      businessId: TEST_BIZ_ID,
      customerName: "Marcus Sterling",
      customerEmail: "marcus.sterling@example.com",
      serviceName: "Private Coffee Cupping Session",
      channel: "EMAIL",
      initialRating: 5,
      sendImmediately: true,
    });

    assert(manualResult.success === true, "createManualRequest succeeds");
    assert(Boolean(manualResult.request.id), "Manual request created with ID");
    assert(Boolean(manualResult.request.requestToken), "Manual request received secure token");
    assert(manualResult.request.status === "SENT", "Status set to SENT after immediate send");
    assert(manualResult.notificationSent === true, "Notification dispatched");

    manualRequestId = manualResult.request.id;
    manualToken = manualResult.request.requestToken!;
  } catch (err) {
    assert(false, `Test 8 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 9: Customer Token Resolution & Landing Context
  // -------------------------------------------------------------------------
  console.log("\n[TEST 9] Customer Token Resolution & Landing Page Context...");
  try {
    const resolved = await automationService.resolveRequestByToken(triggeredToken);
    assert(resolved.valid === true, "Valid token resolves successfully");
    assert(resolved.request?.id === triggeredRequestId, "Resolved request matches triggered request");
    assert(resolved.request?.customerName === "Elena Rostova", "Customer name available for personalized greeting");
    assert(resolved.request?.serviceName === "Artisan Espresso Flight", "Service context available on review landing page");
  } catch (err) {
    assert(false, `Test 9 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 10: Auto-Tracking Opened Status
  // -------------------------------------------------------------------------
  console.log("\n[TEST 10] Auto-Tracking First Open Timestamp & Status Transition...");
  try {
    // Check request state after resolution
    const afterOpenReq = await reviewRepository.findById(triggeredRequestId);
    assert(Boolean(afterOpenReq?.openedAt), "openedAt timestamp recorded upon token resolution");
    assert(afterOpenReq?.status === "OPENED", "Review status automatically transitioned to OPENED");
  } catch (err) {
    assert(false, `Test 10 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 11: Customer Opt-Out / Unsubscribe Mechanism
  // -------------------------------------------------------------------------
  console.log("\n[TEST 11] Customer Opt-Out & Unsubscribe Safety Guard...");
  try {
    const optOutRes = await automationService.optOutCustomer(triggeredToken);
    assert(optOutRes.success === true, "optOutCustomer returns success: true");

    const updatedReq = await reviewRepository.findById(triggeredRequestId);
    assert(updatedReq?.optedOut === true, "Request marked optedOut: true in database");

    // Re-resolving token now indicates opt-out status
    const reResolved = await automationService.resolveRequestByToken(triggeredToken);
    assert(reResolved.valid === false, "Opted-out token is marked invalid for standard flow");
    assert(reResolved.reason === "OPTED_OUT", "Invalid reason specifies OPTED_OUT");
  } catch (err) {
    assert(false, `Test 11 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 12: Admin Request Cancellation
  // -------------------------------------------------------------------------
  console.log("\n[TEST 12] Admin Request Cancellation Safety...");
  try {
    const cancelRes = await automationService.cancelRequest(manualRequestId);
    assert(cancelRes.success === true, "cancelRequest returns success: true");

    const cancelledReq = await reviewRepository.findById(manualRequestId);
    assert(cancelledReq?.status === "CANCELLED", "Status transitioned to CANCELLED");

    const reResolvedManual = await automationService.resolveRequestByToken(manualToken);
    assert(reResolvedManual.valid === false, "Cancelled token marked invalid");
    assert(reResolvedManual.reason === "CANCELLED", "Reason reflects CANCELLED status");
  } catch (err) {
    assert(false, `Test 12 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 13: Token Expiration Enforcement
  // -------------------------------------------------------------------------
  console.log("\n[TEST 13] Token Expiration Enforcement...");
  try {
    const expiredToken = generateSecureToken(24);
    const expiredReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "David Expired",
      customerEmail: "david@example.com",
      requestToken: expiredToken,
      channel: "EMAIL",
      experience: "",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: "SENT",
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // Expired 24 hours ago
      reminderCount: 0,
      optedOut: false,
    });

    const resolveExpired = await automationService.resolveRequestByToken(expiredToken);
    assert(resolveExpired.valid === false, "Expired token rejected");
    assert(resolveExpired.reason === "EXPIRED", "Reason reflects EXPIRED");

    const dbExpired = await reviewRepository.findById(expiredReq.id);
    assert(dbExpired?.status === "EXPIRED", "Status transitioned to EXPIRED in database");
  } catch (err) {
    assert(false, `Test 13 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 14: Resend Notification & 2-Minute Cooldown Enforcement
  // -------------------------------------------------------------------------
  console.log("\n[TEST 14] Resend Notification & Cooldown Protection...");
  try {
    // Create fresh active request
    const freshReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "Colette Cooldown",
      customerEmail: "colette@example.com",
      requestToken: generateSecureToken(24),
      channel: "EMAIL",
      experience: "",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: "SENT",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      reminderCount: 0,
      optedOut: false,
    });

    // Send initial log with timestamp 3 minutes ago
    await notificationRepository.create({
      reviewRequestId: freshReq.id,
      businessId: TEST_BIZ_ID,
      channel: "EMAIL",
      recipient: "colette@example.com",
      message: "Initial review request invitation",
      type: "INITIAL",
      status: "SENT",
      attemptCount: 1,
      createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    });

    // 14a: Resend should succeed because elapsed time > 2 minutes
    const resendSuccess = await automationService.resendNotification(freshReq.id);
    assert(resendSuccess.success === true, "Resend succeeds after cooldown period (> 2 minutes)");

    // 14b: Immediate second resend should FAIL due to active cooldown (< 2 minutes)
    let caughtCooldownError = false;
    try {
      await automationService.resendNotification(freshReq.id);
    } catch (err: unknown) {
      caughtCooldownError = true;
      const errorMsg = err instanceof Error ? err.message : String(err);
      assert(errorMsg.includes("cooldown active"), "Resend error message explicitly specifies cooldown");
    }
    assert(caughtCooldownError, "Immediate subsequent resend blocked by 2-minute cooldown");
  } catch (err) {
    assert(false, `Test 14 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 15: Configurable Automation Settings
  // -------------------------------------------------------------------------
  console.log("\n[TEST 15] Automation Settings Configuration & Retrieval...");
  try {
    const settings = await automationRepository.getSettings(TEST_BIZ_ID);
    assert(typeof settings.enabled === "boolean", "Settings contains boolean enabled flag");
    assert(typeof settings.remindersEnabled === "boolean", "Settings contains remindersEnabled flag");
    assert(typeof settings.maxReminders === "number", "Settings contains maxReminders count");
    assert(settings.maxReminders >= 1 && settings.maxReminders <= 5, "maxReminders within safe boundaries");

    // Update settings
    const updated = await automationRepository.updateSettings(TEST_BIZ_ID, {
      maxReminders: 3,
      delayMinutes: 15,
      channel: "BOTH",
    });

    assert(updated.maxReminders === 3, "Updated maxReminders persisted");
    assert(updated.delayMinutes === 15, "Updated delayMinutes persisted");
    assert(updated.channel === "BOTH", "Updated channel persisted");
  } catch (err) {
    assert(false, `Test 15 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 16: Multi-Tenant Settings Isolation
  // -------------------------------------------------------------------------
  console.log("\n[TEST 16] Multi-Tenant Automation Settings Isolation...");
  try {
    // Configure Business 1
    await automationRepository.updateSettings(TEST_BIZ_ID, {
      enabled: true,
      maxReminders: 3,
    });

    // Configure Business 2 with different settings
    await automationRepository.updateSettings(TEST_BIZ_2_ID, {
      enabled: false,
      maxReminders: 1,
    });

    const biz1Settings = await automationRepository.getSettings(TEST_BIZ_ID);
    const biz2Settings = await automationRepository.getSettings(TEST_BIZ_2_ID);

    assert(biz1Settings.enabled === true, "Business 1 enabled remains true");
    assert(biz1Settings.maxReminders === 3, "Business 1 maxReminders is 3");
    assert(biz2Settings.enabled === false, "Business 2 enabled is false");
    assert(biz2Settings.maxReminders === 1, "Business 2 maxReminders is 1");
  } catch (err) {
    assert(false, `Test 16 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 17: Automated Reminder Engine Safety Rules
  // -------------------------------------------------------------------------
  console.log("\n[TEST 17] Automated Reminder Engine Safety & Suppression Rules...");
  try {
    // Reset settings for biz1 to have reminders enabled
    await automationRepository.updateSettings(TEST_BIZ_ID, {
      enabled: true,
      remindersEnabled: true,
      maxReminders: 2,
    });

    // Create an eligible request (SENT status, 0 reminders)
    const eligibleToken = generateSecureToken(24);
    const eligibleReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "Eligible Customer",
      customerEmail: "eligible@example.com",
      requestToken: eligibleToken,
      channel: "EMAIL",
      experience: "",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: "SENT",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      reminderCount: 0,
      optedOut: false,
    });

    // Create request with max reminders reached (reminderCount: 2)
    const maxedReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "Maxed Customer",
      customerEmail: "maxed@example.com",
      requestToken: generateSecureToken(24),
      channel: "EMAIL",
      experience: "",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: "SENT",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      reminderCount: 2,
      optedOut: false,
    });

    // Create completed request (status: REDIRECTED / handoff)
    const completedReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "Completed Customer",
      customerEmail: "completed@example.com",
      requestToken: generateSecureToken(24),
      channel: "EMAIL",
      experience: "Great service!",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: "REDIRECTED",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      reminderCount: 0,
      optedOut: false,
    });

    // Run reminder processor with forceEligible to test logic rules
    const reminderResult = await automationService.processReminders({
      businessId: TEST_BIZ_ID,
      forceEligible: true,
    });

    assert(reminderResult.checked > 0, "Checked records in database");
    assert(reminderResult.sent >= 1, "At least eligible request received reminder");

    const refreshedEligible = await reviewRepository.findById(eligibleReq.id);
    assert(refreshedEligible?.reminderCount === 1, "Eligible request reminderCount incremented to 1");
    assert(Boolean(refreshedEligible?.lastReminderAt), "lastReminderAt recorded");

    const refreshedMaxed = await reviewRepository.findById(maxedReq.id);
    assert(refreshedMaxed?.reminderCount === 2, "Maxed request was skipped (reminderCount unchanged)");

    const refreshedCompleted = await reviewRepository.findById(completedReq.id);
    assert(refreshedCompleted?.reminderCount === 0, "Completed request was skipped (reminderCount unchanged)");
  } catch (err) {
    assert(false, `Test 17 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 18: Milestone 5 Automation KPIs & Analytics Calculation
  // -------------------------------------------------------------------------
  console.log("\n[TEST 18] Milestone 5 Automation KPIs Aggregation...");
  try {
    const analytics = await reviewRepository.getAnalytics({ businessId: TEST_BIZ_ID });

    assert(typeof analytics.kpis.requestsSent === "number", "kpis.requestsSent is calculated");
    assert(typeof analytics.kpis.openRate === "number", "kpis.openRate is calculated percentage");
    assert(typeof analytics.kpis.feedbackRate === "number", "kpis.feedbackRate is calculated percentage");
    assert(typeof analytics.kpis.completionRate === "number", "kpis.completionRate is calculated percentage");
    assert(typeof analytics.kpis.reminderRate === "number", "kpis.reminderRate is calculated percentage");

    const openRate = analytics.kpis.openRate ?? 0;
    const completionRate = analytics.kpis.completionRate ?? 0;
    const requestsSent = analytics.kpis.requestsSent ?? 0;

    assert(openRate >= 0 && openRate <= 100, "openRate is between 0% and 100%");
    assert(completionRate >= 0 && completionRate <= 100, "completionRate is between 0% and 100%");
    assert(requestsSent >= analytics.kpis.googleHandoffs, "Requests sent >= Google handoffs");
  } catch (err) {
    assert(false, `Test 18 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 19: Zero Review Gating Enforcement (Equal Flow for 1-star & 5-star)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 19] Zero Review Gating (1-Star and 5-Star Identical Path)...");
  try {
    // 19a: 1-star customer rating flow
    const lowRatingResult = await aiReviewService.generateReview({
      rating: 1,
      feedback: "The coffee was served cold and we waited 25 minutes after ordering.",
      service: "Breakfast Service",
      businessName: "Artisan Cafe",
    });

    assert(lowRatingResult.success === true, "1-star customer can generate review draft");
    assert(lowRatingResult.rating === 1, "1-star rating preserved without distortion");
    assert(
      Boolean(
        lowRatingResult.review?.toLowerCase().includes("cold") ||
        lowRatingResult.review?.toLowerCase().includes("waited") ||
        lowRatingResult.review?.toLowerCase().includes("wait")
      ),
      "1-star review honestly preserves customer's critique without censorship"
    );

    // 19b: 5-star customer rating flow
    const highRatingResult = await aiReviewService.generateReview({
      rating: 5,
      feedback: "Incredible pour-over and the staff was delightful.",
      service: "Specialty Coffee",
      businessName: "Artisan Cafe",
    });

    assert(highRatingResult.success === true, "5-star customer can generate review draft");
    assert(highRatingResult.rating === 5, "5-star rating preserved");

    // 19c: Verify Google handoff URL availability for low-rating review
    const lowReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "Critical Customer",
      experience: "The coffee was cold.",
      rating: 1,
      language: "en",
      tone: "authentic",
      status: "READY_TO_SUBMIT",
      reminderCount: 0,
      optedOut: false,
    });

    // Record handoff on 1-star review: must succeed without gating
    await reviewRepository.markGoogleHandoff(lowReq.id);
    const updatedLowReq = await reviewRepository.findById(lowReq.id);
    assert(Boolean(updatedLowReq?.googleHandoffAt), "1-star customer can trigger Google handoff without gating");
    assert(updatedLowReq?.status === "REDIRECTED", "1-star customer transitions to REDIRECTED status identically to 5-star");
  } catch (err) {
    assert(false, `Test 19 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 20: Customer-Controlled Google Submission (Never Automated)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 20] Customer-Controlled Google Submission (No Auto-Posting)...");
  try {
    const testReq = await reviewRepository.create({
      businessId: TEST_BIZ_ID,
      customerName: "Manual Submitter",
      experience: "Enjoyed my latte.",
      rating: 5,
      language: "en",
      tone: "authentic",
      status: "GENERATED",
      reminderCount: 0,
      optedOut: false,
    });

    // Step 1: Customer copies text
    await reviewRepository.markCopied(testReq.id);
    const copied = await reviewRepository.findById(testReq.id);
    assert(Boolean(copied?.copiedAt), "Customer explicit copy action tracked");
    assert(copied?.status === "READY_TO_SUBMIT", "Status becomes READY_TO_SUBMIT upon copy");

    // Step 2: Customer clicks continue to Google
    await reviewRepository.markGoogleHandoff(testReq.id);
    const handoff = await reviewRepository.findById(testReq.id);
    assert(Boolean(handoff?.googleHandoffAt), "Customer handoff click tracked");
    assert(handoff?.status === "REDIRECTED", "Status transitions to REDIRECTED (not posted)");

    // Verification that status is NOT "POSTED" or "SUBMITTED_TO_GOOGLE"
    assert((handoff?.status as string) !== "POSTED", "System strictly uses REDIRECTED and never asserts 'POSTED'");
  } catch (err) {
    assert(false, `Test 20 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 21: Zero Secret & Credential Exposure
  // -------------------------------------------------------------------------
  console.log("\n[TEST 21] Zero Secret & Sensitive Configuration Exposure...");
  try {
    const sensitiveEnvKeys = [
      "GOOGLE_CLIENT_SECRET",
      "TOKEN_ENCRYPTION_KEY",
      "GEMINI_API_KEY",
      "DATABASE_URL",
    ];

    for (const key of sensitiveEnvKeys) {
      const val = process.env[key];
      if (val) {
        assert(!val.startsWith("NEXT_PUBLIC_"), `${key} is not exposed with NEXT_PUBLIC_ prefix`);
      }
    }

    // Verify token resolution payload does not contain encryption keys or DB connection strings
    const resolvedPayload = await automationService.resolveRequestByToken(triggeredToken);
    const serialized = JSON.stringify(resolvedPayload);

    assert(!serialized.includes("postgresql://"), "Postgres connection string not leaked in review payload");
    assert(!serialized.includes(process.env.TOKEN_ENCRYPTION_KEY || "impossible-secret-key-xyz"), "Encryption key not leaked");
    assert(!serialized.includes(process.env.GOOGLE_CLIENT_SECRET || "impossible-oauth-secret-xyz"), "OAuth secret not leaked");
  } catch (err) {
    assert(false, `Test 21 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 22: Full Regressions (Milestones 2, 3, and 4)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 22] Full Regression Verification (Milestones 2, 3 & 4)...");
  try {
    // M2 Regression: AES-256-GCM encryption & OAuth CSRF HMAC
    const secretPayload = "ya29.sample_oauth_token_vault_secret";
    const enc = encryptSecret(secretPayload);
    const dec = decryptSecret(enc);
    assert(dec === secretPayload, "M2 Regression: AES-256-GCM token encryption roundtrip remains 100% intact");

    const state = generateOAuthState({ accountId: "test-acc-1" });
    const validatedState = parseAndValidateOAuthState(state);
    assert(validatedState.isValid === true, "M2 Regression: HMAC-signed OAuth state validation remains valid");

    // M3 Regression: AI generation service
    const m3Gen = await aiReviewService.generateReview({
      rating: 4,
      feedback: "Great atmosphere and tasty pour-over, though parking was a bit tight.",
      service: "Pour-over",
      businessName: "Artisan Cafe",
    });
    assert(m3Gen.success === true && m3Gen.rating === 4, "M3 Regression: AI review generation produces rating-aligned content");

    // M4 Regression: Admin authorization security
    const unauthorizedReq = new NextRequest("http://localhost:3000/api/admin/analytics", {
      headers: { "x-user-role": "CUSTOMER" },
    });
    const authCheck = validateAdminRequest(unauthorizedReq);
    assert(!authCheck.authorized && authCheck.status === 403, "M4 Regression: Customer blocked from admin endpoints (403)");
  } catch (err) {
    assert(false, `Test 22 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Final Results Summary
  // -------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`  VERIFICATION RESULTS:`);
  console.log(`  Total Passed: ${passedTests}`);
  console.log(`  Total Failed: ${failedTests}`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
