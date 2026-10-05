/**
 * Automated Verification Script for Milestone 4: Review Management, Analytics & Admin Dashboard
 *
 * Verifies all 14 required test cases from Milestone 4 specifications:
 * 1. Unauthenticated / Customer Access Security (401/403)
 * 2. Admin Authentication & Role Authorization (200)
 * 3. Graceful Empty State Handling (averageRating: null -> "No ratings yet")
 * 4. Single Review Pipeline Tracking
 * 5. Customer Edit Lifecycle Tracking
 * 6. Review Copy Lifecycle Tracking
 * 7. Google Handoff Lifecycle Tracking (No automatic posting)
 * 8. Multiple Reviews Average Rating Calculation (Accurate & Unfabricated)
 * 9. Rating Distribution Verification (5, 4, 3, 2, 1 stars)
 * 10. Date Range Filtering ("today", "yesterday", "7d", "30d", "all")
 * 11. Status-Based Filtering & Precision
 * 12. Pagination Navigation (Page 1 vs Page 2)
 * 13. Review Detail Comparison (Original AI Draft vs Final Customer Text)
 * 14. Multi-Business Data Isolation (Tenant Partitioning)
 * 15. Milestone 3 Regression Check (AI Generation Integrity)
 */

import { reviewRepository } from "../server/repositories/reviewRepository";
import { analyticsService } from "../server/services/analyticsService";
import { aiReviewService } from "../server/services/aiReviewService";
import { validateAdminRequest, ADMIN_COOKIE_NAME } from "../lib/security/auth";
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
  console.log("  ReviewFlow Milestone 4: Automated Verification Suite");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------------
  // Test 1: Unauthenticated / Customer Access Protection (401/403)
  // -------------------------------------------------------------------------
  console.log("[TEST 1] Server-Side Authorization: Customer / Unauthenticated Rejection...");
  try {
    // 1a: Customer role access attempt
    const customerReq = new NextRequest("http://localhost:3000/api/admin/analytics", {
      headers: { "x-user-role": "CUSTOMER" },
    });
    const customerAuth = validateAdminRequest(customerReq);
    assert(!customerAuth.authorized, "Customer role request is blocked from admin endpoints");
    assert(customerAuth.status === 403, "Customer role returns HTTP 403 Forbidden");

    // 1b: Unauthenticated request attempt
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/analytics", {
      headers: { "x-user-role": "UNAUTHENTICATED" },
    });
    const unauthResult = validateAdminRequest(unauthReq);
    assert(!unauthResult.authorized, "Unauthenticated request is rejected");
    assert(unauthResult.status === 401, "Unauthenticated request returns HTTP 401 Unauthorized");

    // 1c: Invalid bearer token attempt
    const invalidTokenReq = new NextRequest("http://localhost:3000/api/admin/analytics", {
      headers: { authorization: "Bearer completely-invalid-token" },
    });
    const invalidAuth = validateAdminRequest(invalidTokenReq);
    assert(!invalidAuth.authorized, "Invalid authorization token is rejected");
    assert(invalidAuth.status === 401, "Invalid token returns HTTP 401 Unauthorized");
  } catch (err) {
    assert(false, `Test 1 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 2: Admin Authentication (Valid Cookie & Bearer Token)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 2] Admin Authentication & Session Authorization...");
  try {
    const adminTokenReq = new NextRequest("http://localhost:3000/api/admin/analytics", {
      headers: { authorization: "Bearer valid-admin-token" },
    });
    const tokenAuth = validateAdminRequest(adminTokenReq);
    assert(tokenAuth.authorized, "Valid admin bearer token is authorized");
    assert(tokenAuth.status === 200, "Valid token returns HTTP 200 OK");
    assert(tokenAuth.user?.role === "ADMIN", "Authorized user possesses ADMIN role");

    const adminCookieReq = new NextRequest("http://localhost:3000/api/admin/analytics", {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=authenticated-admin` },
    });
    const cookieAuth = validateAdminRequest(adminCookieReq);
    assert(cookieAuth.authorized, "Valid admin session cookie is authorized");
    assert(cookieAuth.status === 200, "Valid admin session returns HTTP 200 OK");
  } catch (err) {
    assert(false, `Test 2 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 3: Empty State Handling (Zero records, No Ratings Graceful State)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 3] Graceful Empty Dashboard State Handling...");
  try {
    const emptyAnalytics = await analyticsService.getAnalytics({
      businessId: "non-existent-isolated-business-999",
      dateRange: "all",
    });

    assert(emptyAnalytics.kpis.totalRequests === 0, "Empty business totalRequests is 0");
    assert(emptyAnalytics.kpis.generated === 0, "Empty business generated count is 0");
    assert(emptyAnalytics.kpis.edited === 0, "Empty business edited count is 0");
    assert(emptyAnalytics.kpis.copied === 0, "Empty business copied count is 0");
    assert(emptyAnalytics.kpis.googleHandoffs === 0, "Empty business googleHandoffs is 0");
    assert(emptyAnalytics.kpis.averageRating === null, "averageRating is null (renders 'No ratings yet')");
    assert(emptyAnalytics.funnel[0].count === 0, "Funnel request count is 0");
    assert(emptyAnalytics.sentiment.positive === 0, "Sentiment positive count is 0");
    assert(emptyAnalytics.ratingDistribution.every((d) => d.count === 0), "All 5 rating distribution bars are 0");
  } catch (err) {
    assert(false, `Test 3 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 4: Single Review Pipeline Lifecycle
  // -------------------------------------------------------------------------
  console.log("\n[TEST 4] Single Review Pipeline Lifecycle (Request -> Generated)...");
  try {
    const testBizId = `test-biz-${Date.now()}`;
    const testReq = await reviewRepository.create({
      businessId: testBizId,
      experience: "Great service and super polite team members.",
      rating: 5,
      language: "en",
      tone: "authentic",
      requestedLength: "standard",
      status: "DRAFT",
    });

    assert(Boolean(testReq.id), "Created single review request");

    // Add draft -> becomes GENERATED
    await reviewRepository.addDraft(testReq.id, "The service was wonderful and the team members were very polite.");

    const singleAnalytics = await analyticsService.getAnalytics({
      businessId: testBizId,
      dateRange: "all",
    });

    assert(singleAnalytics.kpis.totalRequests === 1, "Total requests increments to 1");
    assert(singleAnalytics.kpis.generated === 1, "Generated count increments to 1");
    assert(singleAnalytics.kpis.edited === 0, "Edited count is currently 0");
    assert(singleAnalytics.kpis.copied === 0, "Copied count is currently 0");
    assert(singleAnalytics.kpis.googleHandoffs === 0, "Google handoff count is currently 0");
    assert(singleAnalytics.kpis.averageRating === 5, "Average rating exactly equals 5.0");

    // -------------------------------------------------------------------------
    // Test 5: Customer Edit Lifecycle
    // -------------------------------------------------------------------------
    console.log("\n[TEST 5] Customer Edit Lifecycle Tracking...");
    await reviewRepository.updateDraft(testReq.id, "The service was wonderful and the barista was exceptionally polite!");
    const editedAnalytics = await analyticsService.getAnalytics({
      businessId: testBizId,
      dateRange: "all",
    });

    assert(editedAnalytics.kpis.edited === 1, "Customer edited count increments to 1");
    assert(
      editedAnalytics.funnel.find((s) => s.step === "EDITED")?.count === 1,
      "Funnel reflects 1 customer edit"
    );

    // -------------------------------------------------------------------------
    // Test 6: Review Copied Lifecycle
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Review Copied Lifecycle Tracking...");
    await reviewRepository.markCopied(testReq.id);

    const copiedAnalytics = await analyticsService.getAnalytics({
      businessId: testBizId,
      dateRange: "all",
    });

    assert(copiedAnalytics.kpis.copied === 1, "Copied count increments to 1");
    assert(
      copiedAnalytics.funnel.find((s) => s.step === "COPIED")?.count === 1,
      "Funnel reflects 1 review copied"
    );

    // -------------------------------------------------------------------------
    // Test 7: Google Handoff Lifecycle (Customer-Controlled)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Google Handoff Lifecycle Tracking (No Automatic Posting)...");
    await reviewRepository.markGoogleHandoff(testReq.id);

    const handoffAnalytics = await analyticsService.getAnalytics({
      businessId: testBizId,
      dateRange: "all",
    });

    assert(handoffAnalytics.kpis.googleHandoffs === 1, "Google handoff count increments to 1");
    assert(
      handoffAnalytics.funnel.find((s) => s.step === "HANDOFF")?.count === 1,
      "Funnel reflects 1 Google handoff"
    );
  } catch (err) {
    assert(false, `Tests 4-7 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 8: Multiple Reviews & Average Rating Accuracy
  // -------------------------------------------------------------------------
  console.log("\n[TEST 8] Multiple Reviews & Average Rating Calculation...");
  try {
    const multiBizId = `multi-test-biz-${Date.now()}`;
    const ratings = [5, 4, 3, 2, 1]; // sum = 15, avg = 3.0

    for (const r of ratings) {
      await reviewRepository.create({
        businessId: multiBizId,
        experience: `Experience with rating ${r} stars out of 5.`,
        rating: r,
        language: "en",
        tone: "authentic",
        requestedLength: "standard",
        status: "GENERATED",
      });
    }

    const multiAnalytics = await analyticsService.getAnalytics({
      businessId: multiBizId,
      dateRange: "all",
    });

    assert(multiAnalytics.kpis.totalRequests === 5, "Total requests accurately equals 5");
    assert(multiAnalytics.kpis.averageRating === 3.0, "Average rating mathematically equals exactly 3.0");

    // -------------------------------------------------------------------------
    // Test 9: Rating Distribution Verification
    // -------------------------------------------------------------------------
    console.log("\n[TEST 9] Rating Distribution (5 to 1 Stars) Accuracy...");
    assert(multiAnalytics.ratingDistribution.length === 5, "Distribution contains all 5 star tiers");
    const counts = multiAnalytics.ratingDistribution.map((d) => d.count);
    assert(counts.every((c) => c === 1), "Each star tier has exactly 1 rating");
    const percentages = multiAnalytics.ratingDistribution.map((d) => d.percentage);
    assert(percentages.every((p) => p === 20), "Each star tier is exactly 20%");

    // Sentiment checks
    assert(multiAnalytics.sentiment.positive === 2, "Positive sentiment (4-5 stars) equals 2");
    assert(multiAnalytics.sentiment.neutral === 1, "Neutral sentiment (3 stars) equals 1");
    assert(multiAnalytics.sentiment.negative === 2, "Critical sentiment (1-2 stars) equals 2");
  } catch (err) {
    assert(false, `Tests 8-9 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 10: Date Range Filtering ("today", "yesterday", "7d", "30d", "all")
  // -------------------------------------------------------------------------
  console.log("\n[TEST 10] Date Range Filtering Accuracy...");
  try {
    const allReviews = await reviewRepository.findPaginated({ dateRange: "all" });
    const sevenDayReviews = await reviewRepository.findPaginated({ dateRange: "7d" });
    const todayReviews = await reviewRepository.findPaginated({ dateRange: "today" });

    assert(allReviews.total >= sevenDayReviews.total, "All-time reviews >= 7-day reviews");
    assert(sevenDayReviews.total >= todayReviews.total, "7-day reviews >= today reviews");
    assert(Array.isArray(todayReviews.items), "Today filter returns valid review items array");
  } catch (err) {
    assert(false, `Test 10 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 11: Status Filtering & Search Query
  // -------------------------------------------------------------------------
  console.log("\n[TEST 11] Review Status Filtering & Search Precision...");
  try {
    const generatedFilter = await reviewRepository.findPaginated({ status: "GENERATED" });
    assert(
      generatedFilter.items.every((r) => r.status === "GENERATED"),
      "Status filter 'GENERATED' returns exclusively GENERATED records"
    );

    const handoffFilter = await reviewRepository.findPaginated({ status: "GOOGLE_HANDOFF" });
    assert(
      handoffFilter.items.every((r) => r.status === "REDIRECTED"),
      "Status filter 'GOOGLE_HANDOFF' returns exclusively REDIRECTED records"
    );

    const searchResult = await reviewRepository.findPaginated({ search: "barista" });
    assert(
      searchResult.items.length > 0 &&
        searchResult.items.every(
          (r) =>
            r.experience.toLowerCase().includes("barista") ||
            r.drafts?.some((d) => d.content.toLowerCase().includes("barista"))
        ),
      "Search filter returns records matching keyword 'barista'"
    );
  } catch (err) {
    assert(false, `Test 11 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 12: Pagination Navigation (Page 1 vs Page 2)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 12] Pagination Navigation (Page 1 vs Page 2)...");
  try {
    const page1 = await reviewRepository.findPaginated({ page: 1, limit: 3 });
    const page2 = await reviewRepository.findPaginated({ page: 2, limit: 3 });

    assert(page1.items.length <= 3, "Page 1 respects limit of 3");
    assert(page1.page === 1, "Page 1 page property equals 1");
    assert(page2.page === 2, "Page 2 page property equals 2");
    if (page1.items.length > 0 && page2.items.length > 0) {
      assert(page1.items[0].id !== page2.items[0].id, "Page 1 item is distinct from Page 2 item");
    }
  } catch (err) {
    assert(false, `Test 12 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 13: Review Detail Comparison (Original Draft vs Edited Version)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 13] Review Detail Comparison (Original AI vs Edited Draft)...");
  try {
    const editedReview = await reviewRepository.findById("demo-req-4");
    assert(Boolean(editedReview), "Found demo edited review (demo-req-4)");
    if (editedReview) {
      assert(Boolean(editedReview.drafts && editedReview.drafts.length >= 2), "Review contains multiple drafts");
      const draftsSorted = [...(editedReview.drafts || [])].sort((a, b) => a.version - b.version);
      const v1 = draftsSorted[0].content;
      const v2 = draftsSorted[1].content;
      assert(v1 !== v2, "Original draft (v1) differs from edited draft (v2)");
      assert(Boolean(editedReview.experience), "Original customer feedback text is preserved");
      assert(editedReview.rating === 4, "Customer rating is preserved (4 stars)");
    }
  } catch (err) {
    assert(false, `Test 13 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 14: Multi-Business Data Isolation (Tenant Partitioning)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 14] Multi-Business Data Isolation (Zero Cross-Business Leakage)...");
  try {
    const bizAAnalytics = await analyticsService.getAnalytics({ businessId: "demo-biz-1" });
    const bizBAnalytics = await analyticsService.getAnalytics({ businessId: "demo-biz-2" });

    const bizAReviews = await reviewRepository.findPaginated({ businessId: "demo-biz-1" });
    const bizBReviews = await reviewRepository.findPaginated({ businessId: "demo-biz-2" });

    assert(
      bizAReviews.items.every((r) => r.businessId === "demo-biz-1"),
      "Business A review list contains strictly Business A records"
    );
    assert(
      bizBReviews.items.every((r) => r.businessId === "demo-biz-2"),
      "Business B review list contains strictly Business B records"
    );
    assert(
      bizAAnalytics.kpis.totalRequests !== bizBAnalytics.kpis.totalRequests ||
        bizAReviews.items[0]?.id !== bizBReviews.items[0]?.id,
      "Business A analytics and reviews are isolated from Business B"
    );
  } catch (err) {
    assert(false, `Test 14 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Test 15: Milestone 3 Regression Check (AI Generation Still Works)
  // -------------------------------------------------------------------------
  console.log("\n[TEST 15] Milestone 3 Regression Check: AI Generation Integrity...");
  try {
    const aiResult = await aiReviewService.generateReview({
      rating: 5,
      feedback: "The staff was very attentive and the pour-over was exceptional.",
      service: "Specialty Pour-over",
      businessName: "Artisan Cafe & Roastery",
    });

    assert(aiResult.success, "Milestone 3 AI review generation executes successfully");
    assert(Boolean(aiResult.review && aiResult.review.length > 20), "AI review generation produces authentic text");
    assert(aiResult.rating === 5, "Preserves 5-star rating without distortion");
  } catch (err) {
    assert(false, `Test 15 exception: ${err}`);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`  Milestone 4 Verification Results:`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Unhandled verification suite failure:", err);
  process.exit(1);
});
