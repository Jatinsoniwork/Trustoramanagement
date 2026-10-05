"use client";

import * as React from "react";
import {
  Sparkles,
  Building2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { StarRatingInput } from "@/components/reviews/star-rating-input";
import { ReviewPreviewCard } from "@/components/reviews/review-preview-card";
import { GoogleHandoffModal } from "@/components/reviews/google-handoff-modal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Business } from "@/types";

export interface CustomerReviewFormProps {
  business?: Business | null;
  businessId?: string;
  reviewRequestId?: string;
  initialRating?: number;
  initialExperience?: string;
  customerName?: string | null;
  serviceName?: string | null;
  unsubscribeUrl?: string | null;
}

export function CustomerReviewForm({
  business,
  businessId = business?.id,
  reviewRequestId,
  initialRating = 0,
  initialExperience = "",
  customerName,
  serviceName,
  unsubscribeUrl,
}: CustomerReviewFormProps) {
  // Form state
  const [rating, setRating] = React.useState<number>(initialRating);
  const [feedback, setFeedback] = React.useState<string>(initialExperience);
  const [service, setService] = React.useState<string>(serviceName || "");
  const [highlights, setHighlights] = React.useState<string>("");
  const [staffMention, setStaffMention] = React.useState<string>("");
  const [recommendation, setRecommendation] = React.useState<boolean | null>(null);

  // UI accordion state for optional questions
  const [showOptional, setShowOptional] = React.useState(false);

  // Errors state
  const [errors, setErrors] = React.useState<{ rating?: string; feedback?: string; general?: string }>({});

  // Generation state
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedReview, setGeneratedReview] = React.useState<string | null>(null);
  const [reviewVersion, setReviewVersion] = React.useState<number>(1);
  const [resolvedReviewUrl, setResolvedReviewUrl] = React.useState<string | null>(
    business?.googleReviewUrl || business?.googleMapsUrl || null
  );

  // Handoff modal state
  const [handoffOpen, setHandoffOpen] = React.useState(false);

  const validate = (): boolean => {
    const errs: { rating?: string; feedback?: string } = {};

    if (!rating || rating < 1 || rating > 5) {
      errs.rating = "Please select a rating.";
    }

    if (!feedback.trim()) {
      errs.feedback = "Please tell us a little about your experience.";
    } else if (feedback.trim().length < 10) {
      errs.feedback = "Please enter at least 10 characters describing your experience.";
    } else if (feedback.trim().length > 2000) {
      errs.feedback = "Feedback cannot exceed 2000 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = async (variantIdx = 0) => {
    if (!validate()) return;

    setIsGenerating(true);
    setErrors({});

    try {
      const response = await fetch("/api/reviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim(),
          service: service.trim() || undefined,
          highlights: highlights.trim() || undefined,
          staffMention: staffMention.trim() || undefined,
          recommendation: recommendation ?? undefined,
          businessId,
          reviewRequestId,
          businessName: business?.name,
          businessCategory: business?.category,
          variantIndex: variantIdx,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrors({ general: data.message || "We couldn't generate the review right now. Please try again." });
        return;
      }

      setGeneratedReview(data.review);
      setReviewVersion(data.version || variantIdx + 1);
      if (data.googleReviewUrl) {
        setResolvedReviewUrl(data.googleReviewUrl);
      }
    } catch {
      setErrors({ general: "A network error occurred. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate(reviewVersion);
  };

  const handleEditSave = async (updatedReview: string) => {
    setGeneratedReview(updatedReview);

    if (reviewRequestId) {
      try {
        await fetch("/api/reviews/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewRequestId,
            action: "edit",
            content: updatedReview,
          }),
        });
      } catch {
        // Silently preserve local edit if network fails
      }
    }
  };

  const handleHandoffRedirect = async () => {
    if (reviewRequestId) {
      try {
        await fetch("/api/reviews/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewRequestId,
            action: "redirect",
          }),
        });
      } catch {
        // Safe fallback
      }
    }
  };

  const handleResetForm = () => {
    setGeneratedReview(null);
    setReviewVersion(1);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Business Header Banner */}
      <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xs text-center space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mb-1">
          <Building2 className="h-5 w-5" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {customerName ? `Hi ${customerName}, how was your experience?` : business?.name || "Share Your Customer Experience"}
        </h2>
        {customerName && business && (
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {business.name}
          </p>
        )}
        {serviceName && (
          <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
            Service: {serviceName}
          </p>
        )}
        {business && !customerName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {business.category} • {business.location}
          </p>
        )}
        <p className="text-xs text-zinc-400 max-w-md mx-auto pt-1">
          Share your genuine feedback in 30 seconds. We&apos;ll help you formulate a clear, polished review ready for Google.
        </p>
      </div>

      {/* General Error Notice */}
      {errors.general && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <p>{errors.general}</p>
        </div>
      )}

      {/* Review Form Card (Shown when review is not yet generated or when editing input) */}
      {!generatedReview ? (
        <Card className="border-zinc-200/90 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* 1. Star Rating (Required) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                How would you rate your overall experience? <span className="text-rose-500">*</span>
              </label>
              <StarRatingInput
                value={rating}
                onChange={(val) => {
                  setRating(val);
                  if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }));
                }}
                disabled={isGenerating}
                error={errors.rating}
              />
            </div>

            {/* 2. Customer Experience (Required) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                <span>
                  Tell us about your experience <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-zinc-400">
                  {feedback.length} / 2000 chars
                </span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  if (errors.feedback) setErrors((prev) => ({ ...prev, feedback: undefined }));
                }}
                disabled={isGenerating}
                rows={4}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-950 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-400 leading-relaxed"
                placeholder="What did you visit for? How was the service, staff, or product quality?"
              />
              {errors.feedback && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.feedback}</p>
              )}
            </div>

            {/* 3. Optional Specific Aspects Accordion */}
            <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3 sm:p-4">
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="w-full flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                <span>Add more details (optional — service, highlights, staff)</span>
                {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showOptional && (
                <div className="space-y-4 pt-4 mt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
                  {/* Service or product used */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                      What specific service or product did you use?
                    </label>
                    <input
                      type="text"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-400"
                      placeholder="e.g. Cardamom bun, Wild mushroom risotto, ACL physical therapy"
                    />
                  </div>

                  {/* Highlights / what stood out */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                      What stood out the most?
                    </label>
                    <input
                      type="text"
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-400"
                      placeholder="e.g. Quick turnaround, on-time appointments, relaxing ambiance"
                    />
                  </div>

                  {/* Staff mention */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                      Any specific staff member or department to mention?
                    </label>
                    <input
                      type="text"
                      value={staffMention}
                      onChange={(e) => setStaffMention(e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-zinc-400"
                      placeholder="e.g. Dr. Jonathan, the morning barista"
                    />
                  </div>

                  {/* Recommendation toggle */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block">
                      Would you recommend this business to others?
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={recommendation === true ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setRecommendation(recommendation === true ? null : true)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Yes</span>
                      </Button>
                      <Button
                        type="button"
                        variant={recommendation === false ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setRecommendation(recommendation === false ? null : false)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span>No</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action CTA */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Zero fake reviews • 100% genuine experience</span>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleGenerate(0)}
                isLoading={isGenerating}
                disabled={isGenerating}
                className="gap-2 shadow-sm min-w-[150px]"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGenerating ? "Drafting Review..." : "Generate Review"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Review Preview Canvas (Generated State) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Review Preview & Approval
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetForm}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-500" />
              <span>Start Over</span>
            </Button>
          </div>

          <ReviewPreviewCard
            reviewText={generatedReview}
            rating={rating}
            version={reviewVersion}
            isRegenerating={isGenerating}
            onRegenerate={handleRegenerate}
            onEditSave={handleEditSave}
            onContinueToGoogle={() => setHandoffOpen(true)}
          />
        </div>
      )}

      {/* Google Handoff Modal */}
      {generatedReview && (
        <GoogleHandoffModal
          isOpen={handoffOpen}
          onClose={() => setHandoffOpen(false)}
          reviewText={generatedReview}
          googleReviewUrl={resolvedReviewUrl}
          businessName={business?.name}
          onConfirmRedirect={handleHandoffRedirect}
        />
      )}

      {unsubscribeUrl && (
        <div className="text-center pt-2">
          <a
            href={unsubscribeUrl}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2"
          >
            Unsubscribe from future notifications
          </a>
        </div>
      )}
    </div>
  );
}
