"use client";

import * as React from "react";
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured?: boolean;
}

export function ConnectAccountModal({
  isOpen,
  onClose,
  isConfigured = true,
}: ConnectAccountModalProps) {
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handleStartOAuth = () => {
    setIsRedirecting(true);
    // Server route handles 302 redirect to accounts.google.com
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/api/auth/google";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Authorized Google Account"
      description="Official Google OAuth 2.0 Authorization"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Security & Authentication Guarantee */}
        <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Direct Google Consent Authorization
              </h4>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                You will be redirected directly to Google&apos;s official consent page. ReviewFlow never requests, receives, or stores your Google or Gmail account password.
              </p>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="space-y-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 p-4 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block mb-1">
            Authorization Protocol:
          </span>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Select any authorized Google Account in your browser.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Only minimal least-privilege scopes (<code className="text-[10px] bg-zinc-200/70 dark:bg-zinc-800 px-1 py-0.5 rounded">openid</code>, <code className="text-[10px] bg-zinc-200/70 dark:bg-zinc-800 px-1 py-0.5 rounded">profile</code>, <code className="text-[10px] bg-zinc-200/70 dark:bg-zinc-800 px-1 py-0.5 rounded">email</code>) are requested.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Tokens are encrypted with AES-256-GCM before storage in the database.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>You can connect multiple accounts by repeating this process.</span>
            </li>
          </ul>
        </div>

        {!isConfigured && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3.5 border border-amber-300 dark:border-amber-700/60 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Google OAuth Notice</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              Ensure your Google Cloud Console authorized redirect URI is configured. You can click below to continue to the Google authorization consent page.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isRedirecting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleStartOAuth}
            isLoading={isRedirecting}
            disabled={isRedirecting}
            className="gap-1.5 shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Continue to Google</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
