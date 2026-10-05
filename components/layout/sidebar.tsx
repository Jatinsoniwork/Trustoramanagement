"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Building2,
  Share2,
  FileText,
  Activity,
  Settings,
  Shield,
  LogOut,
  Sparkles,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config/branding";
import { cn } from "@/lib/utils/cn";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Admin Analytics", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Businesses", href: "/businesses", icon: Building2 },
    { name: "Google Accounts", href: "/google-accounts", icon: Share2 },
    { name: "Review Requests", href: "/review-requests", icon: FileText },
    { name: "Activity Logs", href: "/activity", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-200 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {APP_CONFIG.name}
          </span>
          <span className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400">
            Operator Console
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Navigation
        </p>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-50 shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-white dark:text-zinc-100"
                      : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Operator Account & Security Footer */}
      <div className="shrink-0 p-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="rounded-lg p-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              OP
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {APP_CONFIG.operator.defaultName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                <Shield className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>Private Console</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert("Session lock placeholder — Admin authentication is active in private mode.")}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="h-3 w-3" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
