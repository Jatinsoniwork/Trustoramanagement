import { businessService } from "@/server/services/businessService";
import { automationService } from "@/server/services/automationService";
import { CustomerReviewForm } from "@/components/reviews/customer-review-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomerReviewPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const business = await businessService.getBusinessById(businessId);

  if (!business) {
    const resolution = await automationService.resolveRequestByToken(businessId);
    if (resolution.request) {
      redirect(`/review/request/${businessId}`);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Branded Bar */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            RF
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight block">ReviewFlow</span>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">Authentic Review Assistant</span>
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

      {/* Main Review Form / Content */}
      <main className="py-6 sm:py-8 flex-1">
        <CustomerReviewForm
          business={business}
          businessId={businessId}
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
