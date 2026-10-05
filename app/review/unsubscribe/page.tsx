"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState<string>("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No valid review token was provided in the link.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/automation/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "You have been successfully unsubscribed.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to process your unsubscribe request.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-600 dark:text-zinc-400">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-bold tracking-tight">Email & SMS Preferences</h1>

        {status === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Would you like to stop receiving automated review requests and reminders for this service?
            </p>
            <Button
              onClick={handleUnsubscribe}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Confirm Unsubscribe
            </Button>
          </div>
        )}

        {status === "loading" && (
          <div className="py-6 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
            <p className="text-sm text-zinc-500">Processing preference update...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3 py-2">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
              Unsubscribed Successfully
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{message}</p>
            <p className="text-[11px] text-zinc-400 pt-2">
              You will not receive any further review notifications or reminders.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3 py-2">
            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-rose-700 dark:text-rose-400">
              Unable to Unsubscribe
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{message}</p>
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              className="mt-2 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm">Loading...</div>}>
      <UnsubscribeContent />
    </React.Suspense>
  );
}
