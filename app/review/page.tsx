import { businessService } from "@/server/services/businessService";
import { CustomerReviewForm } from "@/components/reviews/customer-review-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GenericReviewPage() {
  const businesses = await businessService.getBusinesses({ status: "ACTIVE" });
  const primaryBusiness = businesses[0] || null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            RF
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight block">ReviewFlow</span>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">Customer Review Flow</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Operator Console</span>
        </Link>
      </header>

      {/* Main Review Form */}
      <main className="py-6 sm:py-8 flex-1 space-y-6">
        {/* Business Selector Pills */}
        {businesses.length > 1 && (
          <div className="max-w-2xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 shrink-0 font-medium">Select business:</span>
            {businesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/review/${biz.id}`}
                className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-sky-500 whitespace-nowrap transition-colors"
              >
                {biz.name}
              </Link>
            ))}
          </div>
        )}

        <CustomerReviewForm
          business={primaryBusiness}
          businessId={primaryBusiness?.id}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full pt-6 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-xs text-zinc-400 space-y-1">
        <p>ReviewFlow • Private Operator Review Assistant</p>
        <p className="text-[11px] text-zinc-500">
          Reviews are generated exclusively from genuine customer experiences. You submit the final review directly on Google.
        </p>
      </footer>
    </div>
  );
}
