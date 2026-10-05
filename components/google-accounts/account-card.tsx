"use client";

import * as React from "react";
import Image from "next/image";
import {
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  LogOut,
  Calendar,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { GoogleAccount } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/utils/formatters";

export interface GoogleAccountCardProps {
  account: GoogleAccount;
  onDisconnect: (account: GoogleAccount) => void;
  onReconnect: (account: GoogleAccount) => void;
  onRefreshCheck: (account: GoogleAccount) => Promise<void>;
  isRefreshing?: boolean;
}

export function GoogleAccountCard({
  account,
  onDisconnect,
  onReconnect,
  onRefreshCheck,
  isRefreshing = false,
}: GoogleAccountCardProps) {
  const getStatusIndicator = () => {
    switch (account.status) {
      case "CONNECTED":
        return {
          badge: <Badge variant="success">Connected</Badge>,
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
          message: "Authorization is active and tokens are valid.",
        };
      case "REAUTH_REQUIRED":
        return {
          badge: <Badge variant="warning">Re-auth Required</Badge>,
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
          message: "Google authorization needs to be renewed.",
        };
      case "DISCONNECTED":
        return {
          badge: <Badge variant="neutral">Disconnected</Badge>,
          icon: <AlertCircle className="h-4 w-4 text-zinc-400" />,
          message: "Account disconnected. Credentials removed.",
        };
      case "ERROR":
        return {
          badge: <Badge variant="destructive">Error</Badge>,
          icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
          message: "Error communicating with Google OAuth.",
        };
      case "CONNECTING":
        return {
          badge: <Badge variant="default">Connecting...</Badge>,
          icon: <RotateCw className="h-4 w-4 text-sky-500 animate-spin" />,
          message: "Awaiting Google authorization callback.",
        };
      default:
        return {
          badge: <Badge variant="neutral">{account.status}</Badge>,
          icon: <HelpCircle className="h-4 w-4 text-zinc-400" />,
          message: "Status unknown.",
        };
    }
  };

  const statusInfo = getStatusIndicator();

  return (
    <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <CardContent className="p-5 space-y-4">
        {/* Header: Profile & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {account.profileImageUrl ? (
              <Image
                src={account.profileImageUrl}
                alt={account.displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 border border-zinc-200 dark:border-zinc-700">
                <User className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {account.displayName}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono">
                {account.email}
              </p>
            </div>
          </div>

          <div>{statusInfo.badge}</div>
        </div>

        {/* Security & Scopes Information */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px]">Encrypted at rest (AES-256-GCM)</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1 text-zinc-400">
              <Calendar className="h-3 w-3" />
              <span>Last connected</span>
            </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {account.lastConnectedAt
                ? formatRelativeTime(account.lastConnectedAt)
                : formatDate(account.createdAt)}
            </span>
          </div>

          {account.scopes && (
            <div className="pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-[10px] text-zinc-400 block mb-1">
                Authorized Scopes
              </span>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-1 font-mono">
                {account.scopes}
              </p>
            </div>
          )}
        </div>

        {/* Status notice */}
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          {statusInfo.icon}
          <span className="text-[11px] leading-tight">{statusInfo.message}</span>
        </div>

        {/* Actions Toolbar */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          {account.status === "CONNECTED" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefreshCheck(account)}
                isLoading={isRefreshing}
                className="text-xs h-8 gap-1.5"
                title="Verify and test server-side token refresh"
              >
                <RotateCw className="h-3 w-3" />
                <span>Test Refresh</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisconnect(account)}
                className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 ml-auto"
              >
                <LogOut className="h-3 w-3" />
                <span>Disconnect</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onReconnect(account)}
                className="text-xs h-8 gap-1.5 w-full justify-center"
              >
                <RotateCw className="h-3 w-3" />
                <span>Reconnect Account</span>
              </Button>

              {account.status !== "DISCONNECTED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDisconnect(account)}
                  className="text-xs h-8 text-zinc-500"
                >
                  Clear
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
