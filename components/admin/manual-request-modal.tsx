"use client";

import * as React from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, X, Copy, ExternalLink } from "lucide-react";
import { Business, ReviewRequest } from "@/types";
import { Button } from "@/components/ui/button";

export interface ManualRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  defaultBusinessId?: string;
  onCreated?: () => void;
}

export function ManualRequestModal({
  isOpen,
  onClose,
  businesses,
  defaultBusinessId,
  onCreated,
}: ManualRequestModalProps) {
  const [selectedBusiness, setSelectedBusiness] = React.useState<string>("");
  const businessId =
    selectedBusiness ||
    (defaultBusinessId && defaultBusinessId !== "ALL"
      ? defaultBusinessId
      : businesses[0]?.id || "");

  const [customerName, setCustomerName] = React.useState<string>("");
  const [channel, setChannel] = React.useState<"EMAIL" | "SMS">("EMAIL");
  const [contact, setContact] = React.useState<string>("");
  const [serviceName, setServiceName] = React.useState<string>("");
  const [sendImmediately, setSendImmediately] = React.useState<boolean>(true);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdRequest, setCreatedRequest] = React.useState<ReviewRequest | null>(null);
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      setFeedback({ type: "error", text: "Please select a business." });
      return;
    }
    if (!customerName.trim()) {
      setFeedback({ type: "error", text: "Please enter customer name." });
      return;
    }
    if (!contact.trim()) {
      setFeedback({ type: "error", text: `Please enter customer ${channel.toLowerCase()}.` });
      return;
    }

    setLoading(true);
    setFeedback(null);
    setCreatedRequest(null);

    try {
      const payload = {
        businessId,
        customerName: customerName.trim(),
        channel,
        customerEmail: channel === "EMAIL" ? contact.trim() : undefined,
        customerPhone: channel === "SMS" ? contact.trim() : undefined,
        serviceName: serviceName.trim() || undefined,
        sendImmediately,
      };

      const res = await fetch("/api/automation/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.request) {
        setCreatedRequest(data.request);
        setFeedback({
          type: "success",
          text: data.notificationSent
            ? "Review request created and notification dispatched!"
            : "Review request created successfully.",
        });
        if (onCreated) onCreated();
      } else {
        setFeedback({ type: "error", text: data.message || "Failed to create review request." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error creating review request." });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdRequest?.requestToken) return;
    const url = `${window.location.origin}/review/request/${createdRequest.requestToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReset = () => {
    setCustomerName("");
    setContact("");
    setServiceName("");
    setCreatedRequest(null);
    setFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Create Review Request
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manually dispatch an authentic review invitation to a customer.
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
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="text-xs">{feedback.text}</span>
            </div>
          )}

          {createdRequest ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/30 space-y-3">
                <span className="font-semibold text-sky-900 dark:text-sky-200 block text-sm">
                  Customer Review Link Generated
                </span>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                  A unique, secure token was created for {createdRequest.customerName}.
                </p>

                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] break-all select-all text-zinc-800 dark:text-zinc-200">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/review/request/${createdRequest.requestToken}`
                    : `/review/request/${createdRequest.requestToken}`}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="text-xs flex items-center gap-1.5 flex-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? "Link Copied!" : "Copy Customer Link"}</span>
                  </Button>
                  <a
                    href={`/review/request/${createdRequest.requestToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Flow</span>
                  </a>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleReset} variant="outline" className="text-xs">
                  Create Another Request
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Selector */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Business
                </label>
                <select
                  value={businessId}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-sky-500"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.location || "Default"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Channel Selector */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Notification Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel("EMAIL")}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                      channel === "EMAIL"
                        ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    📧 Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("SMS")}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                      channel === "SMS"
                        ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    💬 SMS
                  </button>
                </div>
              </div>

              {/* Contact input */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  {channel === "EMAIL" ? "Customer Email Address *" : "Customer Phone Number *"}
                </label>
                <input
                  type={channel === "EMAIL" ? "email" : "tel"}
                  required
                  placeholder={channel === "EMAIL" ? "customer@example.com" : "+1 555-019-2834"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Service / Item Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Single-Origin Pour-over Tasting"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Send immediately toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                    Dispatch Immediately
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Send notification to customer now (status: SENT).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sendImmediately}
                  onChange={(e) => setSendImmediately(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Create & Dispatch Request</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
