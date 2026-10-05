"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Business, GoogleAccount } from "@/types";
import { reviewRequestSchema, ReviewRequestInput } from "@/lib/validation/review.schema";

export interface NewReviewContentProps {
  businesses: Business[];
  googleAccounts: GoogleAccount[];
}

export function NewReviewContent({
  businesses,
  googleAccounts,
}: NewReviewContentProps) {
  const router = useRouter();
  const [formData, setFormData] = React.useState<ReviewRequestInput>({
    businessId: businesses[0]?.id || "",
    googleAccountId: googleAccounts[0]?.id || "",
    experience: "",
    rating: 5,
    language: "en",
    tone: "authentic",
    keywords: "",
    requestedLength: "standard",
    status: "DRAFT",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedBusiness = businesses.find((b) => b.id === formData.businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = reviewRequestSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create review request");
      }
      if (data.data?.id) {
        router.push(`/review-requests/${data.data.id}`);
      } else {
        router.push("/review-requests");
      }
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Failed to create review request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/review-requests"
          className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Review Requests</span>
        </Link>
      </div>

      <PageHeader
        title="New Review Request"
        subtitle="Capture a genuine customer experience and configure parameters for review synthesis."
      />

      {/* Operator Authenticity Notice */}
      <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <p className="font-semibold">Authentic Customer Experience Mandate</p>
            <p className="leading-relaxed">
              Every review draft must stem entirely from genuine customer experiences entered by the operator.
              The system prohibits fabricated visits, simulated interactions, and deceptive review practices.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600">
            {errors.form}
          </div>
        )}

        {/* 1. Target Business & Google Account */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">1. Business & Routing</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Target Business"
              value={formData.businessId}
              onChange={(e) =>
                setFormData({ ...formData, businessId: e.target.value })
              }
              error={errors.businessId}
              required
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </Select>

            <Select
              label="Assign Authorized Google Account (Milestone 2)"
              value={formData.googleAccountId || ""}
              onChange={(e) =>
                setFormData({ ...formData, googleAccountId: e.target.value })
              }
              error={errors.googleAccountId}
            >
              <option value="">No account assigned (Unassigned)</option>
              {googleAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName} ({a.email})
                </option>
              ))}
            </Select>

            {selectedBusiness && (
              <div className="sm:col-span-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Google Maps URL:
                </span>{" "}
                <span className="font-mono text-[11px] break-all">
                  {selectedBusiness.googleMapsUrl}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Customer's Genuine Experience */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">
              2. Genuine Customer Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              label="Customer's Real Experience Details"
              placeholder="Record the specific, genuine details shared by the customer (e.g., 'Came in for dinner with a party of 4. Tried the wood-fired trout and roasted asparagus. Service by Alex was timely and gracious...')"
              value={formData.experience}
              onChange={(e) =>
                setFormData({ ...formData, experience: e.target.value })
              }
              rows={4}
              error={errors.experience}
              required
            />
            <p className="text-[11px] text-zinc-400">
              Provide authentic factual notes. The upcoming AI engine will format this into a natural review draft preserving all factual nuances.
            </p>
          </CardContent>
        </Card>

        {/* 3. Review Settings */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">3. Review Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Rating (Stars)"
              value={formData.rating.toString()}
              onChange={(e) =>
                setFormData({ ...formData, rating: parseInt(e.target.value, 10) })
              }
              error={errors.rating}
            >
              <option value="5">5 Stars — Excellent</option>
              <option value="4">4 Stars — Very Good</option>
              <option value="3">3 Stars — Average</option>
              <option value="2">2 Stars — Poor</option>
              <option value="1">1 Star — Terrible</option>
            </Select>

            <Select
              label="Language"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
              error={errors.language}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </Select>

            <Select
              label="Tone"
              value={formData.tone || "authentic"}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              error={errors.tone}
            >
              <option value="authentic">Authentic & Direct</option>
              <option value="warm">Warm & Appreciative</option>
              <option value="professional">Professional & Objective</option>
              <option value="enthusiastic">Enthusiastic & Vivid</option>
            </Select>

            <Select
              label="Requested Length"
              value={formData.requestedLength || "standard"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requestedLength: e.target.value as "short" | "standard" | "detailed",
                })
              }
              error={errors.requestedLength}
            >
              <option value="short">Short (1-2 sentences)</option>
              <option value="standard">Standard (3-4 sentences)</option>
              <option value="detailed">Detailed (In-depth overview)</option>
            </Select>

            <div className="sm:col-span-2">
              <Input
                label="Optional Keywords / Specific Focus (Comma-separated)"
                placeholder="e.g. wood-fired trout, attentive staff, fast seating"
                value={formData.keywords || ""}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                error={errors.keywords}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/review-requests">
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create Review Request</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
