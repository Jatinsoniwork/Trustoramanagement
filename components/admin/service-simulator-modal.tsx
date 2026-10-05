"use client";

import * as React from "react";
import { Zap, CheckCircle2, AlertCircle, Loader2, X, ShieldAlert, Copy, ExternalLink } from "lucide-react";
import { Business, ReviewRequest } from "@/types";
import { Button } from "@/components/ui/button";

export interface ServiceSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  defaultBusinessId?: string;
  onTriggered?: () => void;
}

export function ServiceSimulatorModal({
  isOpen,
  onClose,
  businesses,
  defaultBusinessId,
  onTriggered,
}: ServiceSimulatorModalProps) {
  const [selectedBusiness, setSelectedBusiness] = React.useState<string>("");
  const businessId =
    selectedBusiness ||
    (defaultBusinessId && defaultBusinessId !== "ALL"
      ? defaultBusinessId
      : businesses[0]?.id || "");

  const [serviceId, setServiceId] = React.useState<string>("pos-104921");
  const [serviceName, setServiceName] = React.useState<string>("Express Lunch Service");
  const [customerName, setCustomerName] = React.useState<string>("Marcus Customer");
  const [customerEmail, setCustomerEmail] = React.useState<string>("marcus@example.com");
  const [customerPhone, setCustomerPhone] = React.useState<string>("");
  const [delayMinutes, setDelayMinutes] = React.useState<number>(0);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "duplicate" | "error";
    text: string;
  } | null>(null);
  const [resultRequest, setResultRequest] = React.useState<ReviewRequest | null>(null);
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      setFeedback({ type: "error", text: "Please select a business." });
      return;
    }
    if (!customerName.trim()) {
      setFeedback({ type: "error", text: "Please enter customer name." });
      return;
    }
    if (!customerEmail.trim() && !customerPhone.trim()) {
      setFeedback({ type: "error", text: "Email or phone number is required." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    setResultRequest(null);

    try {
      const payload = {
        businessId,
        serviceId: serviceId.trim(),
        serviceName: serviceName.trim(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        delayMinutes,
      };

      const res = await fetch("/api/automation/service-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultRequest(data.request);
        if (data.isDuplicate) {
          setFeedback({
            type: "duplicate",
            text: "Duplicate event detected! Idempotency protection returned the existing review request without creating duplicates.",
          });
        } else {
          setFeedback({
            type: "success",
            text: data.notificationSent
              ? "Service completion event processed and notification dispatched immediately!"
              : delayMinutes > 0
              ? `Service completion recorded. Review request scheduled for ${delayMinutes} min delay.`
              : "Service completion event processed successfully.",
          });
        }
        if (onTriggered) onTriggered();
      } else {
        setFeedback({ type: "error", text: data.message || "Simulation failed." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error triggering service completion." });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!resultRequest?.requestToken) return;
    const url = `${window.location.origin}/review/request/${resultRequest.requestToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Simulate Service Completion
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Test external POS, CRM, or Booking completion webhook integration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : feedback.type === "duplicate"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : feedback.type === "duplicate" ? (
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span className="text-xs leading-relaxed">{feedback.text}</span>
            </div>
          )}

          {resultRequest && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Target Review URL
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                  Status: {resultRequest.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] break-all select-all text-zinc-800 dark:text-zinc-200">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/review/request/${resultRequest.requestToken}`
                  : `/review/request/${resultRequest.requestToken}`}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="text-xs flex items-center gap-1.5 flex-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                </Button>
                <a
                  href={`/review/request/${resultRequest.requestToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleSimulate} className="space-y-3.5">
            {/* Business */}
            <div className="space-y-1">
              <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                Business
              </label>
              <select
                value={businessId}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-amber-500"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.location || "Default"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Service ID */}
              <div className="space-y-1">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Service / Order ID *
                </label>
                <input
                  type="text"
                  required
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono"
                />
              </div>

              {/* Service Name */}
              <div className="space-y-1">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Service Description
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Customer Email */}
              <div className="space-y-1">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Customer Phone (SMS)
                </label>
                <input
                  type="tel"
                  placeholder="+1 555-019-2834"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>
            </div>

            {/* Delay minutes */}
            <div className="space-y-1">
              <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                Scheduling Delay
              </label>
              <select
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
              >
                <option value={0}>0 minutes (Dispatch immediately)</option>
                <option value={15}>15 minutes (Test scheduled request)</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            {/* Trigger Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Trigger Service Completion Event</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
