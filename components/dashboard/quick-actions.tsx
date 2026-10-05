"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, Building2, Share2, FilePlus2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConnectAccountModal } from "@/components/google-accounts/connect-account-modal";

export interface QuickActionsProps {
  onAddClient?: () => void;
  onAddBusiness?: () => void;
}

export function QuickActions({
  onAddClient,
  onAddBusiness,
}: QuickActionsProps) {
  const [googleModalOpen, setGoogleModalOpen] = React.useState(false);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Add Client */}
            <button
              type="button"
              onClick={onAddClient}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group text-center"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                <UserPlus className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-zinc-850 dark:text-zinc-200">
                Add Client
              </span>
            </button>

            {/* 2. Add Business */}
            <button
              type="button"
              onClick={onAddBusiness}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group text-center"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-zinc-850 dark:text-zinc-200">
                Add Business
              </span>
            </button>

            {/* 3. Connect Google Account (Controlled Milestone Placeholder) */}
            <button
              type="button"
              onClick={() => setGoogleModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group text-center"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                <Share2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-zinc-850 dark:text-zinc-200">
                Connect Google
              </span>
            </button>

            {/* 4. New Review Request */}
            <Link
              href="/review-requests/new"
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group text-center"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                <FilePlus2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-zinc-850 dark:text-zinc-200">
                New Review Request
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Milestone 2 Google Connection Modal */}
      <ConnectAccountModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
      />
    </>
  );
}
