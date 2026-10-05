import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-4">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Record or Page Not Found
      </h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
        The requested resource does not exist or may have been unassigned.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button variant="primary" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
