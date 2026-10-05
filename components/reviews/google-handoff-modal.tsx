"use client";

import * as React from "react";
import {
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export interface GoogleHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewText: string;
  googleReviewUrl?: string | null;
  businessName?: string;
  onConfirmRedirect?: () => void;
}

export function GoogleHandoffModal({
  isOpen,
  onClose,
  reviewText,
  googleReviewUrl,
  businessName = "this business",
  onConfirmRedirect,
}: GoogleHandoffModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [hasRedirected, setHasRedirected] = React.useState(false);

  // Automatically attempt copying upon modal display
  React.useEffect(() => {
    if (isOpen && reviewText) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(reviewText).then(() => setCopied(true)).catch(() => {});
      }
    }
  }, [isOpen, reviewText]);

  const handleManualCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(reviewText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = reviewText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  const handleOpenGoogle = () => {
    if (!googleReviewUrl) return;

    setHasRedirected(true);
    if (onConfirmRedirect) {
      onConfirmRedirect();
    }

    // Open official Google review page in a new window/tab
    window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ready to Submit on Google"
      description={`Final customer submission step for ${businessName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Step 1: Clipboard status */}
        <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                {copied ? "Review Copied to Clipboard" : "Review Ready to Copy"}
              </h4>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                Your review has been drafted and copied to your clipboard. Next, open Google and paste it into the review box.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions list */}
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 p-4 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2 text-xs">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
            What happens next:
          </span>
          <ol className="space-y-2 text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
            <li>Google will open in a new tab.</li>
            <li>Select your star rating on Google.</li>
            <li>Right-click or hold in the review box and select <strong>Paste</strong>.</li>
            <li>Click Google&apos;s <strong>Post</strong> button to publish your review.</li>
          </ol>
        </div>

        {/* Missing Google Review URL Warning if not configured */}
        {!googleReviewUrl && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3.5 border border-amber-300 dark:border-amber-700/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Google Review Link Not Configured</p>
              <p className="text-[11px] mt-0.5 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                The business has not configured their direct Google Review URL yet. You can manually search for the business on Google Maps to paste your copied review.
              </p>
            </div>
          </div>
        )}

        {/* Success Handoff notification if clicked */}
        {hasRedirected && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Google review tab opened. Paste and submit your review there!</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualCopy}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied Again</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Review</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>

            {googleReviewUrl && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleOpenGoogle}
                className="gap-1.5 shadow-sm"
              >
                <span>Continue to Google</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
