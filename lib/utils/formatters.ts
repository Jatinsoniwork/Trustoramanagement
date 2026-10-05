import { ReviewRequestStatus, ClientStatus, BusinessStatus, GoogleAccountStatus } from "@/types";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function getStatusBadgeVariant(
  status: ReviewRequestStatus | ClientStatus | BusinessStatus | GoogleAccountStatus
): {
  label: string;
  className: string;
} {
  switch (status) {
    case "ACTIVE":
    case "CONNECTED":
    case "APPROVED":
    case "COMPLETED":
      return {
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      };
    case "GENERATED":
    case "EDITED":
      return {
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
      };
    case "READY_TO_SUBMIT":
      return {
        label: "Ready to Submit",
        className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-medium",
      };
    case "REDIRECTED":
      return {
        label: "Google Opened",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium",
      };
    case "GENERATING":
      return {
        label: "Generating...",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 animate-pulse",
      };
    case "DRAFT":
      return {
        label: "Draft",
        className: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20",
      };
    case "INACTIVE":
    case "DISCONNECTED":
      return {
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
      };
    case "FAILED":
    case "CANCELLED":
    case "REVOKED":
    case "EXPIRED":
    case "ERROR":
      return {
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      };
    case "REAUTH_REQUIRED":
      return {
        label: "Re-auth Required",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium",
      };
    case "CONNECTING":
      return {
        label: "Connecting...",
        className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 animate-pulse",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20",
      };
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
