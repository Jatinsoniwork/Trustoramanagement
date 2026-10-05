"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  ShieldCheck,
  Share2,
  Cpu,
  Palette,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/config/branding";

type SettingsTab = "general" | "security" | "integrations" | "ai" | "appearance";

export function SettingsContent() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("general");
  const [appName, setAppName] = React.useState<string>(APP_CONFIG.name);
  const [operatorName, setOperatorName] = React.useState<string>(
    APP_CONFIG.operator.defaultName
  );
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
    { id: "general", label: "General", icon: Settings },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "integrations", label: "Integrations", icon: Share2 },
    { id: "ai", label: "AI Configuration", icon: Cpu },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage branding, security posture, integration boundaries, and operator preferences."
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. General Tab */}
      {activeTab === "general" && (
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">General Branding & Operator Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-md">
              {savedSuccess && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Branding preferences saved successfully.</span>
                </div>
              )}

              <Input
                label="Application Name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="ReviewFlow"
                required
              />

              <Input
                label="Primary Operator Name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Lead Operator"
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  <span>Save General Settings</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm font-semibold">Security Principles & Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs text-zinc-600 dark:text-zinc-400">
              <p>
                ReviewFlow operates under strict zero-trust operational security guidelines:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                    1. Zero Password Storage
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Never store or request Google or Gmail account passwords under any circumstance.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                    2. Token Encryption At Rest
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    OAuth access and refresh tokens will be encrypted using AES-256-GCM in PostgreSQL.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                    3. No Client-Side Token Leakage
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    OAuth credentials and secrets are strictly forbidden from client-facing API responses.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                    4. Zero Fabrication Policy
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Review drafts are generated purely from genuine operator-entered customer notes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-semibold">External Service Integrations</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {/* Google OAuth */}
              <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      Google OAuth 2.0 & Token Vault
                    </span>
                    <Badge variant="success">Milestone 2 Active</Badge>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Multi-account OAuth authorization, AES-256-GCM token vault, and server-side token refresh.
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Official Google OAuth 2.0 Integration
                  </p>
                </div>
                <Link href="/google-accounts">
                  <Button variant="outline" size="sm">
                    Manage Accounts
                  </Button>
                </Link>
              </div>

              {/* AI Provider */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                      AI Provider (Gemini / Anthropic / OpenAI)
                    </span>
                    <Badge variant="neutral">Not configured</Badge>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Server-side synthesis of genuine customer experiences into structured review drafts.
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                    Scheduled for Milestone 3
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. AI Tab */}
      {activeTab === "ai" && (
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">AI Synthesis Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs text-zinc-500">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-4 border border-zinc-200/60 dark:border-zinc-800/60 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  AI Review Drafting (Milestone 3)
                </p>
                <p>
                  API keys and temperature/prompt settings are not configured in Milestone 1. In Milestone 3, all generation prompts will be anchored directly in genuine customer facts without speculative hallucinations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Appearance Tab */}
      {activeTab === "appearance" && (
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">Appearance & Theme</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs text-zinc-600 dark:text-zinc-400">
            <p>
              ReviewFlow uses clean, high-contrast, professional slate and zinc typography tailored for desktop operator ergonomics.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="rounded-lg border-2 border-zinc-900 dark:border-zinc-100 p-3 bg-white dark:bg-zinc-900 text-center w-28">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  System Theme
                </span>
                <span className="text-[10px] text-zinc-400 mt-1 block">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
