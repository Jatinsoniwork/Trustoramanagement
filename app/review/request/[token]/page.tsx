import { automationService } from "@/server/services/automationService";
import { businessRepository } from "@/server/repositories/businessRepository";
import { CustomerReviewForm } from "@/components/reviews/customer-review-form";
import Link from "next/link";
import { AlertCircle, Clock, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CustomerReviewTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolution = await automationService.resolveRequestByToken(token);

  if (!resolution.valid || !resolution.request) {
    const reason = resolution.reason;
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            {reason === "EXPIRED" ? (
              <Clock className="h-6 w-6" />
            ) : reason === "OPTED_OUT" ? (
              <ShieldAlert className="h-6 w-6" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight">
            {reason === "EXPIRED"
              ? "Review Link Expired"
              : reason === "CANCELLED"
              ? "Review Request Cancelled"
              : reason === "OPTED_OUT"
              ? "Unsubscribed"
              : "Review Link Not Found"}
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {reason === "EXPIRED"
              ? "This review invitation has expired for security and freshness. If you still wish to leave feedback, please contact the business directly."
              : reason === "CANCELLED"
              ? "This review request has been cancelled by the business."
              : reason === "OPTED_OUT"
              ? "You previously opted out of review invitations for this service."
              : "We could not find an active review request for this link. It may have already been used or expired."}
          </p>

          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" className="text-xs">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const request = resolution.request;
  const business = await businessRepository.findById(request.businessId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Bar */}
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

      {/* Main Review Form */}
      <main className="py-6 sm:py-8 flex-1">
        <CustomerReviewForm
          business={business}
          businessId={request.businessId}
          reviewRequestId={request.id}
          initialRating={request.rating}
          initialExperience={request.experience}
          customerName={request.customerName}
          serviceName={request.serviceName}
          unsubscribeUrl={`/review/unsubscribe?token=${token}`}
        />
      </main>

      {/* Footer with Unsubscribe Option */}
      <footer className="max-w-2xl mx-auto w-full pt-6 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-xs text-zinc-400 space-y-2">
        <p>ReviewFlow • Private Customer Review Assistant</p>
        <p className="text-[11px] text-zinc-500">
          Reviews are generated exclusively from genuine customer experiences. You submit the final review directly on Google.
        </p>
        <div className="pt-1">
          <Link
            href={`/review/unsubscribe?token=${token}`}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2"
          >
            Unsubscribe / Opt out of reminders
          </Link>
        </div>
      </footer>
    </div>
  );
}
