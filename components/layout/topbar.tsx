"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TopbarProps {
  onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-medium text-[11px]">
            <ShieldCheck className="h-3 w-3" />
            Operator Mode (Private)
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span>Single-operator workflow engine</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/review-requests/new">
          <Button variant="primary" size="sm" className="gap-1.5 font-medium shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>New Review Request</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
