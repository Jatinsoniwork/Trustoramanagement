export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "ReviewFlow",
  tagline: "Operator Command Center for Authentic Customer Reviews",
  description:
    "Private multi-client review workflow management platform operated as a white-glove service.",
  version: "1.0.0-phase1",
  operator: {
    defaultName: "Lead Operator",
    defaultEmail: "operator@reviewflow.local",
    defaultRole: "ADMIN" as const,
  },
  links: {
    overview: "/dashboard",
    clients: "/clients",
    businesses: "/businesses",
    googleAccounts: "/google-accounts",
    reviewRequests: "/review-requests",
    activity: "/activity",
    settings: "/settings",
  },
  milestones: {
    current: "Milestone 1 — Architecture, Database Foundation & UX Shell",
    next: "Milestone 2 — Secure Google OAuth 2.0 & Token Vault",
  },
} as const;
