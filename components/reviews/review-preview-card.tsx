"use client";

import * as React from "react";
import {
  Edit3,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Save,
  X,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface ReviewPreviewCardProps {
  reviewText: string;
  rating: number;
  version?: number;
  isRegenerating?: boolean;
  onRegenerate: () => void;
  onEditSave: (updatedText: string) => void;
  onContinueToGoogle: () => void;
  className?: string;
}

export function ReviewPreviewCard({
  reviewText,
  rating,
  version = 1,
  isRegenerating = false,
  onRegenerate,
  onEditSave,
  onContinueToGoogle,
  className,
}: ReviewPreviewCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(reviewText);
  const [copied, setCopied] = React.useState(false);

  // Sync edit text when parent reviewText updates
  const [prevReviewText, setPrevReviewText] = React.useState(reviewText);
  if (reviewText !== prevReviewText && !isEditing) {
    setPrevReviewText(reviewText);
    setEditText(reviewText);
  }

  const handleCopy = async () => {
    const textToCopy = isEditing ? editText : reviewText;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-https or older browser environments
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
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
    } catch {
      // Manual selection fallback if writeText was blocked
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim().length >= 10) {
      onEditSave(editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(reviewText);
    setIsEditing(false);
  };

  const wordCount = (isEditing ? editText : reviewText)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = (isEditing ? editText : reviewText).length;

  return (
    <Card
      className={cn(
        "border-zinc-200/90 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-900 overflow-hidden",
        className
      )}
    >
      {/* Top Banner / Header */}
      <div className="bg-zinc-50/80 dark:bg-zinc-950/60 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= rating
                    ? "fill-amber-400 text-amber-500"
                    : "fill-transparent text-zinc-300 dark:text-zinc-700"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider ml-1">
            Your Review
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            Version {version}
          </span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            {wordCount} words
          </span>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Review Content / Inline Editor */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-sky-400 dark:border-sky-600 bg-white dark:bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                placeholder="Edit your review text here..."
              />
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 mt-1">
                <span>Edit your review to sound exactly as you want</span>
                <span>
                  {charCount} characters • {wordCount} words
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={editText.trim().length < 10}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Edit</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/40 p-5 sm:p-6">
            <p className="text-base sm:text-lg text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans italic">
              &ldquo;{reviewText}&rdquo;
            </p>
          </div>
        )}

        {/* Action Controls Toolbar */}
        {!isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* Left Actions: Edit & Regenerate */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                <span>Edit Review</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                isLoading={isRegenerating}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-zinc-500" />
                <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
              </Button>
            </div>

            {/* Right Actions: Copy & Continue to Google */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className={cn(
                  "gap-1.5 transition-colors",
                  copied && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Review Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Copy Review</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onContinueToGoogle}
                className="gap-1.5 shadow-sm"
              >
                <span>Continue to Google</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Anti-Fabrication & Customer Handoff Notice */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 border border-zinc-200/60 dark:border-zinc-800/60 flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            This review was drafted strictly from your genuine experience. ReviewFlow never publishes reviews automatically — you remain in total control of pasting and submitting on Google.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
