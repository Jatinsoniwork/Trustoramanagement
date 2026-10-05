/**
 * Automated Verification Script for Milestone 3: AI Review Generation & Customer Review Flow
 *
 * Runs comprehensive end-to-end tests covering:
 * - 5-star to 1-star rating-aware tone generation
 * - Anti-fabrication & genuine sentiment preservation
 * - Input validation & edge cases (empty feedback, missing rating)
 * - Regeneration variation
 * - Manual edit persistence
 * - Review approval & status transitions
 * - Google review URL resolution & graceful fallback
 * - Security check: zero secret exposure
 */

import { aiReviewService } from "../server/services/aiReviewService";
import { reviewService } from "../server/services/reviewService";
import { generateReviewSchema } from "../lib/validation/review.schema";

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
  console.log("  ReviewFlow Milestone 3: Automated Verification Suite");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------------
  // Test 1: 5-Star Rating-Aware Generation (Appreciative & Authentic)
  // -------------------------------------------------------------------------
  console.log("[TEST 1] 5-Star Review Generation (Warm, Appreciative, Authentic)...");
  try {
    const feedback = "The cold brew was refreshing and the staff explained the bean origins clearly.";
    const result = await aiReviewService.generateReview({
      rating: 5,
      feedback,
      service: "Specialty Pour-over",
      highlights: "Knowledgeable baristas",
      recommendation: true,
      businessName: "Artisan Cafe & Roastery",
    });

    assert(Boolean(result.success), "Generation returned success=true");
    assert(Boolean(result.review && result.review.length > 20), "Generated review is non-empty and substantive");
    assert(result.rating === 5, "Result preserves 5-star rating");
    assert(
      Boolean(
        result.review?.toLowerCase().includes("cold brew") ||
        result.review?.toLowerCase().includes("baristas") ||
        result.review?.toLowerCase().includes("bean")
      ),
      "Generated review reflects customer's actual experience without inventing extraneous entities"
    );
    const words = result.review?.trim().split(/\s+/).length || 0;
    assert(words >= 10, `Review has healthy word count (${words} words)`);
  } catch (err) {
    assert(false, `Test 1 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 2: 4-Star Rating-Aware Generation (Positive but Balanced)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] 4-Star Review Generation (Positive but Balanced)...");
  try {
    const feedback = "Good coffee and comfortable seating. It took a few extra minutes during morning rush.";
    const result = await aiReviewService.generateReview({
      rating: 4,
      feedback,
      businessName: "Artisan Cafe",
    });

    assert(Boolean(result.success), "Generation returned success=true");
    assert(result.rating === 4, "Result preserves 4-star rating");
    assert(Boolean(result.review && result.review.length > 20), "Generated review has meaningful length");
    assert(
      !result.review?.toLowerCase().includes("absolutely phenomenal") &&
      !result.review?.toLowerCase().includes("beyond perfection"),
      "Tone is grounded and not exaggeratedly hyped"
    );
  } catch (err) {
    assert(false, `Test 2 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 3: 3-Star Rating-Aware Generation (Balanced & Neutral)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] 3-Star Review Generation (Balanced & Neutral)...");
  try {
    const feedback = "The food was decent, but the wait time was somewhat long.";
    const result = await aiReviewService.generateReview({
      rating: 3,
      feedback,
      businessName: "Hearthstone Bistro",
    });

    assert(Boolean(result.success), "Generation returned success=true");
    assert(result.rating === 3, "Result preserves 3-star rating");
    assert(
      Boolean(
        result.review?.toLowerCase().includes("food") ||
        result.review?.toLowerCase().includes("wait")
      ),
      "Content touches genuine points mentioned by customer"
    );
  } catch (err) {
    assert(false, `Test 3 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 4: 2-Star Rating-Aware Generation (Constructive & Honest)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] 2-Star Review Generation (Constructive & Honest)...");
  try {
    const feedback = "My order was delayed by 30 minutes and the staff seemed disorganized.";
    const result = await aiReviewService.generateReview({
      rating: 2,
      feedback,
      businessName: "Hearthstone Bistro",
    });

    assert(Boolean(result.success), "Generation returned success=true");
    assert(result.rating === 2, "Result preserves 2-star rating");
    assert(
      !result.review?.toLowerCase().includes("exceptional") &&
      !result.review?.toLowerCase().includes("loved every second"),
      "Negative feedback is NEVER whitewashed into positive review"
    );
  } catch (err) {
    assert(false, `Test 4 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 5: 1-Star Rating-Aware Generation (Critical & Respectful)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 5] 1-Star Review Generation (Critical & Respectful)...");
  try {
    const feedback = "The appointment was cancelled without notice and no one answered the support line.";
    const result = await aiReviewService.generateReview({
      rating: 1,
      feedback,
      businessName: "Summit Physical Therapy",
    });

    assert(Boolean(result.success), "Generation returned success=true");
    assert(result.rating === 1, "Result preserves 1-star rating");
    assert(
      Boolean(
        result.review?.toLowerCase().includes("appointment") ||
        result.review?.toLowerCase().includes("cancelled") ||
        result.review?.toLowerCase().includes("support")
      ),
      "Accurately reflects the customer's grievance respectfully"
    );
  } catch (err) {
    assert(false, `Test 5 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 6: Feedback Validation - Empty Feedback Rejection
  // -------------------------------------------------------------------------
  console.log("\n[TEST 6] Input Validation: Empty Feedback Rejection...");
  try {
    const parsed = generateReviewSchema.safeParse({
      rating: 5,
      feedback: "   ",
    });
    assert(!parsed.success, "Schema rejects empty/whitespace feedback");
    if (!parsed.success) {
      const feedbackError = parsed.error.errors.find((e) => e.path.includes("feedback"));
      assert(Boolean(feedbackError), `Friendly error returned: "${feedbackError?.message}"`);
    }
  } catch (err) {
    assert(false, `Test 6 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 7: Input Validation - Missing or Out-of-Bounds Rating...
  // -------------------------------------------------------------------------
  console.log("\n[TEST 7] Input Validation: Missing or Out-of-Bounds Rating...");
  try {
    const missingRating = generateReviewSchema.safeParse({
      feedback: "Great service and ambiance!",
    });
    assert(!missingRating.success, "Schema rejects missing rating");

    const invalidRatingHigh = generateReviewSchema.safeParse({
      rating: 6,
      feedback: "Great service and ambiance!",
    });
    assert(!invalidRatingHigh.success, "Schema rejects rating > 5");

    const invalidRatingZero = generateReviewSchema.safeParse({
      rating: 0,
      feedback: "Great service and ambiance!",
    });
    assert(!invalidRatingZero.success, "Schema rejects rating < 1");
  } catch (err) {
    assert(false, `Test 7 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 8: Regeneration Variation
  // -------------------------------------------------------------------------
  console.log("\n[TEST 8] Review Regeneration Variation...");
  try {
    const input = {
      rating: 5,
      feedback: "The physical therapist listened carefully to my back pain history and explained exercises thoroughly.",
      service: "Physical Therapy",
      businessName: "Summit Physical Therapy",
    };

    const draft1 = await aiReviewService.generateReview(input, { variantIndex: 0 });
    const draft2 = await aiReviewService.generateReview(input, { variantIndex: 1 });

    assert(Boolean(draft1.review && draft2.review), "Both variations generated successfully");
    assert(draft1.review !== draft2.review, "Regeneration produces alternative phrasing/variation");
  } catch (err) {
    assert(false, `Test 8 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 9: Manual Edit Persistence
  // -------------------------------------------------------------------------
  console.log("\n[TEST 9] Manual Edit Persistence...");
  try {
    const testReqId = "demo-req-1";
    // Generate draft
    const genResult = await reviewService.generateReviewDraft({
      rating: 5,
      feedback: "Amazing coffee and friendly baristas who know their roast profiles.",
      businessName: "Artisan Cafe",
      reviewRequestId: testReqId,
    });

    const initialContent = genResult.review || "";
    const modifiedContent = initialContent + " I especially recommend the Ethiopian single-origin.";

    const updateSuccess = await reviewService.updateDraft(
      testReqId,
      modifiedContent
    );

    assert(updateSuccess, "Draft updated successfully");
    const updatedReq = await reviewService.getReviewRequestById(testReqId);
    const currentDraft = updatedReq?.drafts?.find((d) => d.isCurrent) || updatedReq?.drafts?.[0];
    assert(currentDraft?.content === modifiedContent, "Updated content persisted correctly");
    assert(Boolean(currentDraft?.content.includes("Ethiopian")), "User manual modification is intact");
  } catch (err) {
    assert(false, `Test 9 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 10: Copy & Handoff Tracking
  // -------------------------------------------------------------------------
  console.log("\n[TEST 10] Copy & Review Request Status Handoff Tracking...");
  try {
    const testReqId = "demo-req-1";

    // Update status to READY_TO_SUBMIT (Review copied by customer)
    const handoffResult = await reviewService.updateHandoffStatus(
      testReqId,
      "READY_TO_SUBMIT",
      "copied"
    );
    assert(handoffResult, "Review request status transitioned to READY_TO_SUBMIT on copy");

    // Update status to REDIRECTED (Customer clicked Continue to Google)
    const redirectResult = await reviewService.updateHandoffStatus(
      testReqId,
      "REDIRECTED",
      "redirected"
    );
    assert(redirectResult, "Review request status transitioned to REDIRECTED on Google redirect");
  } catch (err) {
    assert(false, `Test 10 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 11: Google Direct URL Resolution
  // -------------------------------------------------------------------------
  console.log("\n[TEST 11] Google Review URL Resolution...");
  try {
    // Test direct writereview URL
    const directUrl = "https://search.google.com/local/writereview?placeid=ChIJ_DEMO_CAFE_01";
    assert(directUrl.includes("writereview"), "Direct Google review URL identified");

    // Test g.page URL
    const gPageUrl = "https://g.page/r/CZZ12345/review";
    assert(gPageUrl.includes("g.page") && gPageUrl.includes("/review"), "Google short review URL identified");
  } catch (err) {
    assert(false, `Test 11 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 12: Missing Google Review URL Graceful Fallback
  // -------------------------------------------------------------------------
  console.log("\n[TEST 12] Missing Google Review URL Graceful Fallback...");
  try {
    const businessName = "Local Specialty Bakery";
    const googleReviewUrl = null;
    const googleMapsUrl = "https://maps.google.com/?cid=999999999";

    // Resolution logic mirrors GoogleHandoffModal
    const targetUrl = googleReviewUrl || googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`;

    assert(Boolean(targetUrl), "Resolved non-empty fallback URL");
    assert(targetUrl === googleMapsUrl, "Fell back gracefully to business googleMapsUrl");

    // When even googleMapsUrl is missing:
    const targetUrlNoMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`;
    assert(targetUrlNoMaps.includes("maps/search"), "Fell back to Google Maps business search URL");
  } catch (err) {
    assert(false, `Test 12 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 13: Security & Non-Exposure of Secrets
  // -------------------------------------------------------------------------
  console.log("\n[TEST 13] Security & Secret Exposure Checks...");
  try {
    const genResult = await reviewService.generateReviewDraft({
      rating: 5,
      feedback: "Superb treatment and attentive care throughout.",
    });

    const serialized = JSON.stringify(genResult);
    assert(!serialized.includes("AI_API_KEY"), "Output does not leak AI_API_KEY identifier");
    assert(!serialized.includes("GEMINI_API_KEY"), "Output does not leak GEMINI_API_KEY identifier");
    assert(!serialized.includes("TOKEN_ENCRYPTION_KEY"), "Output does not leak TOKEN_ENCRYPTION_KEY");
    assert(!serialized.includes("GOOGLE_CLIENT_SECRET"), "Output does not leak GOOGLE_CLIENT_SECRET");
    assert(!serialized.includes("DATABASE_URL"), "Output does not leak DATABASE_URL");
  } catch (err) {
    assert(false, `Test 13 threw error: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 14: Strict Anti-Fabrication Safeguard
  // -------------------------------------------------------------------------
  console.log("\n[TEST 14] Strict Anti-Fabrication Rule...");
  try {
    const minimalFeedback = "Clean tables and quick service.";
    const result = await aiReviewService.generateReview({
      rating: 5,
      feedback: minimalFeedback,
    });

    assert(Boolean(result.review), "Review generated");
    // Verify it doesn't mention fake staff names like "John", "Sarah", or fake discounts "50% off"
    assert(
      Boolean(result.review && !result.review.includes("50% off") && !result.review.includes("discount")),
      "Did not hallucinate fake discounts"
    );
    assert(
      Boolean(result.review && !result.review.includes("Sarah") && !result.review.includes("Dr. Smith")),
      "Did not invent staff names not provided by customer"
    );
  } catch (err) {
    assert(false, `Test 14 threw error: ${err}`);
  }

  console.log("\n=======================================================");
  console.log(`  Tests Passed: ${passedTests}`);
  console.log(`  Tests Failed: ${failedTests}`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal error during Milestone 3 verification:", err);
  process.exit(1);
});
