"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Basic error logging without exposing stack traces to external users
    console.error("Dashboard error boundary caught:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        An Unexpected Error Occurred
      </h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
        The application encountered an issue while processing this request. Privileged error details have been kept server-side.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="primary" size="sm" onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  );
}
