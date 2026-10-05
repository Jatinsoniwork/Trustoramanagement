"use client";

import * as React from "react";
import {
  Sparkles,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  Save,
  X,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReviewDraft } from "@/types";
import { GoogleHandoffModal } from "@/components/reviews/google-handoff-modal";

export interface DraftViewerProps {
  drafts?: ReviewDraft[];
  reviewRequestId?: string;
  experience?: string;
  rating?: number;
  businessName?: string;
  googleReviewUrl?: string | null;
  onStatusChange?: (status: string) => void;
}

export function DraftViewer({
  drafts: initialDrafts = [],
  reviewRequestId,
  experience = "",
  rating = 5,
  businessName,
  googleReviewUrl,
  onStatusChange,
}: DraftViewerProps) {
  const [draftsList, setDraftsList] = React.useState<ReviewDraft[]>(initialDrafts);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [isApproved, setIsApproved] = React.useState(false);
  const [handoffOpen, setHandoffOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const currentDraft = draftsList.find((d) => d.isCurrent) || draftsList[0];

  const [prevDraftContent, setPrevDraftContent] = React.useState(currentDraft?.content || "");
  if (currentDraft && currentDraft.content !== prevDraftContent && !isEditing) {
    setPrevDraftContent(currentDraft.content);
    setEditText(currentDraft.content);
  }

  const handleGenerate = async (variantIdx = 0) => {
    if (!experience.trim()) {
      setErrorMessage("No customer experience available to draft a review from.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/reviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: experience.trim(),
          reviewRequestId,
          businessName,
          variantIndex: variantIdx,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Unable to generate review draft.");
        return;
      }

      const newDraft: ReviewDraft = {
        id: `draft-${Date.now()}`,
        reviewRequestId: reviewRequestId || "temp",
        content: data.review,
        version: data.version || draftsList.length + 1,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setDraftsList((prev) => [
        newDraft,
        ...prev.map((d) => ({ ...d, isCurrent: false })),
      ]);
      setEditText(data.review);
      if (onStatusChange) onStatusChange("GENERATED");
    } catch {
      setErrorMessage("Network error during review generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    if (reviewRequestId) {
      try {
        await fetch("/api/reviews/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewRequestId,
            action: "edit",
            content: editText.trim(),
          }),
        });
      } catch {
        // Silently preserve local update
      }
    }

    setDraftsList((prev) =>
      prev.map((d) =>
        d.id === currentDraft?.id ? { ...d, content: editText.trim() } : d
      )
    );
    setIsEditing(false);
    if (onStatusChange) onStatusChange("EDITED");
  };

  const handleCopy = async () => {
    if (!currentDraft?.content) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentDraft.content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = currentDraft.content;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      if (reviewRequestId) {
        await fetch("/api/reviews/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewRequestId, action: "copy" }),
        });
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleApprove = async () => {
    if (!reviewRequestId) return;
    try {
      const res = await fetch("/api/reviews/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewRequestId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsApproved(true);
        if (onStatusChange) onStatusChange("APPROVED");
      }
    } catch {
      // Safe fallback
    }
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-500" />
          <CardTitle className="text-sm font-semibold">Generated Review Draft</CardTitle>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {currentDraft ? `Version ${currentDraft.version}` : "Drafting Engine"}
        </span>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Error message */}
        {errorMessage && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Review Preview Canvas / Editor */}
        <div className="relative min-h-[140px] rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 sm:p-5 flex flex-col justify-center">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-sky-400 dark:border-sky-600 bg-white dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  <span>Cancel</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="gap-1 text-xs"
                >
                  <Save className="h-3 w-3" />
                  <span>Save</span>
                </Button>
              </div>
            </div>
          ) : currentDraft ? (
            <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans italic">
              &ldquo;{currentDraft.content}&rdquo;
            </p>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                No draft generated yet.
              </p>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                Click &ldquo;Generate Review&rdquo; below to synthesize a polished review draft from the genuine experience above.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        {!isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleGenerate(draftsList.length)}
                isLoading={isGenerating}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{currentDraft ? "Regenerate Draft" : "Generate Review"}</span>
              </Button>

              {currentDraft && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentDraft && (
                <>
                  <Button
                    type="button"
                    variant={isApproved ? "outline" : "secondary"}
                    size="sm"
                    onClick={handleApprove}
                    disabled={isApproved}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{isApproved ? "Approved" : "Approve"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setHandoffOpen(true)}
                    className="gap-1.5 shadow-sm"
                  >
                    <span>Google Handoff</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Google Handoff Modal */}
      {currentDraft && (
        <GoogleHandoffModal
          isOpen={handoffOpen}
          onClose={() => setHandoffOpen(false)}
          reviewText={currentDraft.content}
          googleReviewUrl={googleReviewUrl}
          businessName={businessName}
        />
      )}
    </Card>
  );
}
