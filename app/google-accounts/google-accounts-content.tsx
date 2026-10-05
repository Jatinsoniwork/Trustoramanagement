"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { GoogleAccountCard } from "@/components/google-accounts/account-card";
import { ConnectAccountModal } from "@/components/google-accounts/connect-account-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { GoogleAccount } from "@/types";

export interface GoogleAccountsContentProps {
  initialAccounts: GoogleAccount[];
  isOAuthConfigured?: boolean;
}

export function GoogleAccountsContent({
  initialAccounts,
  isOAuthConfigured = true,
}: GoogleAccountsContentProps) {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = React.useState<GoogleAccount[]>(initialAccounts);
  const [connectModalOpen, setConnectModalOpen] = React.useState(false);
  const [disconnectingAccount, setDisconnectingAccount] =
    React.useState<GoogleAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [refreshingAccountId, setRefreshingAccountId] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    fetch("/api/google-accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.accounts) {
          setAccounts(data.accounts);
        }
      })
      .catch(() => {});
  }, []);

  const [notification, setNotification] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) return { type: "success", message: decodeURIComponent(success) };
    if (error) {
      if (error === "oauth_not_configured") {
        return {
          type: "error",
          message:
            "Google OAuth is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file to enable account connection.",
        };
      }
      return { type: "error", message: decodeURIComponent(error) };
    }
    return null;
  });

  const handleDisconnectConfirm = async () => {
    if (!disconnectingAccount) return;
    try {
      setIsDisconnecting(true);
      const res = await fetch("/api/google-accounts/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: disconnectingAccount.id }),
      });
      const data = await res.json();

      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === disconnectingAccount.id
              ? { ...a, status: "DISCONNECTED" }
              : a
          )
        );
        setNotification({
          type: "success",
          message: `Disconnected ${disconnectingAccount.email}. Credentials safely revoked and cleared.`,
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to disconnect account.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "An error occurred while disconnecting the account.",
      });
    } finally {
      setIsDisconnecting(false);
      setDisconnectingAccount(null);
    }
  };

  const handleReconnect = (account: GoogleAccount) => {
    const params = new URLSearchParams({
      accountId: account.id,
      loginHint: account.email,
    });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  const handleRefreshCheck = async (account: GoogleAccount) => {
    setRefreshingAccountId(account.id);
    try {
      const res = await fetch("/api/google-accounts/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id }),
      });
      const data = await res.json();

      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id
              ? { ...a, status: "CONNECTED", lastConnectedAt: new Date() }
              : a
          )
        );
        setNotification({
          type: "success",
          message: `Token refresh successful for ${account.email}. New encrypted access token active.`,
        });
      } else {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id ? { ...a, status: "REAUTH_REQUIRED" } : a
          )
        );
        setNotification({
          type: "error",
          message:
            data.error ||
            "Token refresh failed. Google authorization needs to be renewed.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "Network or server error during token refresh.",
      });
    } finally {
      setRefreshingAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Accounts"
        subtitle="Manage authorized Google accounts used in your review workflows."
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => setConnectModalOpen(true)}
          className="gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Connect Google Account</span>
        </Button>
      </PageHeader>

      {/* URL Banner Notifications (Callback success or error) */}
      {notification && (
        <div
          className={`rounded-xl border p-4 flex items-start justify-between gap-3 animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Security Architecture Box */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60 dark:border-emerald-800/40">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Encrypted Token Vault & OAuth 2.0 Layer</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
              All Google authorization uses official OAuth 2.0 with minimal least-privilege scopes. Access tokens and refresh tokens are encrypted at rest with <strong>AES-256-GCM</strong> authenticated encryption. Plaintext tokens are never stored, logged, or exposed in client responses.
            </p>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Authorized Accounts ({accounts.length})
          </h2>
          <span className="text-[11px] text-zinc-400">
            Multi-account routing enabled
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
            <p className="text-xs text-zinc-500">
              No authorized Google accounts registered yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConnectModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Connect First Account</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <GoogleAccountCard
                key={acc.id}
                account={acc}
                onDisconnect={(account) => setDisconnectingAccount(account)}
                onReconnect={(account) => handleReconnect(account)}
                onRefreshCheck={(account) => handleRefreshCheck(account)}
                isRefreshing={refreshingAccountId === acc.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Connect Account Modal */}
      <ConnectAccountModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        isConfigured={isOAuthConfigured}
      />

      {/* Disconnect Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!disconnectingAccount}
        onClose={() => setDisconnectingAccount(null)}
        onConfirm={handleDisconnectConfirm}
        title="Disconnect Google Account"
        description={`Are you sure you want to disconnect "${disconnectingAccount?.displayName}" (${disconnectingAccount?.email})? Google authorization will be revoked and sensitive tokens permanently cleared.`}
        confirmLabel="Disconnect & Revoke"
        isDestructive
        isLoading={isDisconnecting}
      />
    </div>
  );
}
