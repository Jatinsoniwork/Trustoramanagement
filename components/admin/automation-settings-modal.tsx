"use client";

import * as React from "react";
import { Settings, Save, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { AutomationSettings } from "@/types";
import { Button } from "@/components/ui/button";

export interface AutomationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onSaved?: () => void;
}

export function AutomationSettingsModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  onSaved,
}: AutomationSettingsModalProps) {
  const [settings, setSettings] = React.useState<AutomationSettings | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen || !businessId || businessId === "ALL") return;

    let cancelled = false;
    fetch(`/api/automation/settings?businessId=${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.success && data.settings) {
            setSettings(data.settings);
          } else {
            setFeedback({ type: "error", text: data.message || "Failed to load settings." });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeedback({ type: "error", text: "Network error loading automation settings." });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/automation/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", text: "Automation settings saved successfully." });
        if (onSaved) onSaved();
      } else {
        setFeedback({ type: "error", text: data.message || "Failed to update settings." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while saving settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Automation Settings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                {businessName}
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
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-700 dark:text-zinc-300">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs text-zinc-400">Loading settings...</p>
            </div>
          )}

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

          {!loading && settings && (
            <div className="space-y-4">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Automation Engine Active
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Automatically generate requests on service completion events.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Delivery Channel */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Default Notification Channel
                </label>
                <select
                  value={settings.channel}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      channel: e.target.value as "EMAIL" | "SMS" | "BOTH",
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="EMAIL">Email Only</option>
                  <option value="SMS">SMS Only</option>
                  <option value="BOTH">Smart Hybrid (Email preferred, fallback to SMS)</option>
                </select>
              </div>

              {/* Delay Minutes */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Post-Service Request Delay (Minutes)
                </label>
                <select
                  value={settings.delayMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, delayMinutes: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={0}>Immediate (0 min delay)</option>
                  <option value={15}>15 minutes after service</option>
                  <option value={60}>1 hour after service</option>
                  <option value={120}>2 hours after service</option>
                  <option value={1440}>24 hours after service</option>
                </select>
              </div>

              {/* Reminders Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                    Follow-Up Reminders
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Send gentle reminders if customer has not yet opened or completed review.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.remindersEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, remindersEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Reminder Details */}
              {settings.remindersEnabled && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                      Max Reminders
                    </label>
                    <select
                      value={settings.maxReminders}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxReminders: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    >
                      <option value={1}>1 Reminder</option>
                      <option value={2}>2 Reminders (Recommended)</option>
                      <option value={3}>3 Reminders (Max)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                      Interval Between
                    </label>
                    <select
                      value={settings.reminderIntervalHours}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          reminderIntervalHours: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    >
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours (1 Day)</option>
                      <option value={48}>48 Hours (2 Days)</option>
                      <option value={72}>72 Hours (3 Days)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Expiration Days */}
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-100 block">
                  Link Expiration Duration
                </label>
                <select
                  value={settings.expirationDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      expirationDays: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Standard)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !settings}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
