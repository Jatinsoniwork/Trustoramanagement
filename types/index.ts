export type AdminRole = "ADMIN" | "OPERATOR";

export type ClientStatus = "ACTIVE" | "INACTIVE";

export type BusinessStatus = "ACTIVE" | "INACTIVE";

export type GoogleAccountStatus =
  | "CONNECTED"
  | "REAUTH_REQUIRED"
  | "DISCONNECTED"
  | "ERROR"
  | "CONNECTING"
  | "REVOKED"
  | "EXPIRED";

export type ReviewRequestStatus =
  | "DRAFT"
  | "CREATED"
  | "SCHEDULED"
  | "SENT"
  | "OPENED"
  | "FEEDBACK_STARTED"
  | "FEEDBACK_SUBMITTED"
  | "GENERATING"
  | "GENERATED"
  | "EDITED"
  | "APPROVED"
  | "READY_TO_SUBMIT"
  | "REDIRECTED"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "CANCELLED";

export type ActivityAction =
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "CLIENT_DEACTIVATED"
  | "BUSINESS_CREATED"
  | "BUSINESS_UPDATED"
  | "BUSINESS_DEACTIVATED"
  | "GOOGLE_ACCOUNT_CONNECTED"
  | "GOOGLE_ACCOUNT_RECONNECTED"
  | "GOOGLE_ACCOUNT_DISCONNECTED"
  | "GOOGLE_ACCOUNT_REAUTH_REQUIRED"
  | "GOOGLE_ACCOUNT_REFRESH_FAILED"
  | "REVIEW_REQUEST_CREATED"
  | "REVIEW_REQUEST_SCHEDULED"
  | "REVIEW_REQUEST_SENT"
  | "REVIEW_REQUEST_OPENED"
  | "REVIEW_REQUEST_UPDATED"
  | "FEEDBACK_STARTED"
  | "FEEDBACK_SUBMITTED"
  | "REVIEW_GENERATED"
  | "REVIEW_EDITED"
  | "REVIEW_APPROVED"
  | "REVIEW_COPIED"
  | "REVIEW_REDIRECTED_TO_GOOGLE"
  | "REVIEW_COMPLETED"
  | "SERVICE_COMPLETED"
  | "REMINDER_SENT"
  | "REQUEST_COMPLETED"
  | "REQUEST_EXPIRED"
  | "REQUEST_CANCELLED"
  | "NOTIFICATION_FAILED"
  | "CUSTOMER_OPTED_OUT"
  | "AUTOMATION_SETTINGS_UPDATED"
  | "SYSTEM_SETTING_UPDATED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  businessId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Client {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  notes?: string | null;
  status: ClientStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  businesses?: Business[];
  _count?: {
    businesses: number;
    reviewRequests?: number;
  };
}

export interface Business {
  id: string;
  clientId: string;
  name: string;
  googleMapsUrl: string;
  googleReviewUrl?: string | null;
  placeIdentifier?: string | null;
  category: string;
  location: string;
  notes?: string | null;
  status: BusinessStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  client?: Client;
  reviewRequests?: ReviewRequest[];
  _count?: {
    reviewRequests: number;
  };
}

export interface GoogleAccount {
  id: string;
  email: string;
  displayName: string;
  googleUserId?: string | null;
  profileImageUrl?: string | null;
  scopes?: string | null;
  status: GoogleAccountStatus;
  tokenExpiresAt?: Date | string | null;
  lastConnectedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Tokens are never exposed in UI models
}

export interface ReviewDraft {
  id: string;
  reviewRequestId: string;
  content: string;
  version: number;
  isCurrent: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReviewRequest {
  id: string;
  businessId: string;
  googleAccountId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  requestToken?: string | null;
  channel?: "EMAIL" | "SMS" | "LINK";
  experience: string;
  rating: number;
  language: string;
  tone?: string | null;
  keywords?: string | null;
  requestedLength?: string | null;
  status: ReviewRequestStatus;
  scheduledAt?: Date | string | null;
  sentAt?: Date | string | null;
  openedAt?: Date | string | null;
  feedbackSubmittedAt?: Date | string | null;
  completedAt?: Date | string | null;
  copiedAt?: Date | string | null;
  googleHandoffAt?: Date | string | null;
  reminderCount?: number;
  lastReminderAt?: Date | string | null;
  expiresAt?: Date | string | null;
  optedOut?: boolean;
  regenerationCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  business?: Business;
  googleAccount?: GoogleAccount | null;
  drafts?: ReviewDraft[];
}

export interface ActivityLog {
  id: string;
  actorId?: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
  actor?: AdminUser | null;
}

export interface DashboardMetrics {
  totalClients: number;
  totalBusinesses: number;
  connectedGoogleAccounts: number;
  pendingReviews: number;
  approvedReviews: number;
}

export interface GenerateReviewInput {
  rating: number; // 1-5
  feedback: string;
  service?: string | null;
  highlights?: string | null;
  recommendation?: boolean | null;
  staffMention?: string | null;
  businessName?: string;
  businessCategory?: string;
  reviewRequestId?: string;
  businessId?: string;
}

export interface GenerateReviewResponse {
  success: boolean;
  review?: string;
  rating?: number;
  version?: number;
  message?: string;
  reviewRequestId?: string;
  googleReviewUrl?: string | null;
}

// -------------------------------------------------------------------------
// Milestone 4: Admin Analytics & Review Management Types
// -------------------------------------------------------------------------

export interface AnalyticsKPIs {
  totalRequests: number;
  generated: number;
  edited: number;
  copied: number;
  googleHandoffs: number;
  averageRating: number | null; // e.g. 4.6 or null if no ratings
  totalFeedback: number;
  // Milestone 5 Automation KPIs
  requestsSent?: number;
  openRate?: number; // percentage (0-100)
  feedbackRate?: number; // percentage (0-100)
  completionRate?: number; // percentage (0-100)
  reminderRate?: number; // percentage (0-100)
  failedRequests?: number;
}

export interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number; // relative to totalRequests
  dropoffPercentage: number;
}

export interface RatingDistributionItem {
  stars: number;
  count: number;
  percentage: number;
}

export interface SentimentOverview {
  positive: number; // 4-5 stars
  neutral: number;  // 3 stars
  negative: number; // 1-2 stars
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}

export interface TrendDataPoint {
  date: string;
  label: string;
  requests: number;
  generated: number;
  googleHandoffs: number;
  averageRating: number | null;
}

export interface FeedbackThemeInsight {
  theme: string;
  count: number;
  sentiment: "positive" | "neutral" | "negative";
  sampleFeedback?: string;
}

export interface AdminAnalyticsData {
  kpis: AnalyticsKPIs;
  funnel: FunnelStep[];
  ratingDistribution: RatingDistributionItem[];
  sentiment: SentimentOverview;
  trends: TrendDataPoint[];
  feedbackThemes: FeedbackThemeInsight[];
  peakActivityText?: string | null;
}

export interface AdminReviewFilters {
  businessId?: string;
  dateRange?: "today" | "yesterday" | "7d" | "30d" | "90d" | "all";
  rating?: number; // 1-5
  status?: string; // e.g. "GENERATED" | "EDITED" | "COPIED" | "GOOGLE_HANDOFF" | "FAILED" | "ALL"
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedReviewsResponse {
  items: ReviewRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// -------------------------------------------------------------------------
// Milestone 5: Automation & Notification Types
// -------------------------------------------------------------------------

export interface AutomationSettings {
  businessId: string;
  enabled: boolean;
  channel: "EMAIL" | "SMS" | "BOTH";
  delayMinutes: number; // e.g. 0 for immediate trigger
  remindersEnabled: boolean;
  maxReminders: number; // default 2, max 3
  reminderIntervalHours: number; // default 24 hours
  expirationDays: number; // default 7 days
  smsSenderId?: string | null;
  emailSenderName?: string | null;
  customMessageTemplate?: string | null;
  updatedAt?: Date | string;
}

export interface NotificationLog {
  id: string;
  reviewRequestId: string;
  businessId: string;
  channel: "EMAIL" | "SMS";
  recipient: string;
  subject?: string | null;
  message: string;
  type: "INITIAL" | "REMINDER" | "RESEND";
  status: "SENT" | "FAILED" | "QUEUED";
  error?: string | null;
  attemptCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface ServiceCompletionEvent {
  businessId: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  channel?: "EMAIL" | "SMS";
  delayMinutes?: number;
  metadata?: Record<string, unknown> | null;
}

export interface CreateManualRequestInput {
  businessId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  channel: "EMAIL" | "SMS";
  serviceName?: string;
  initialExperience?: string;
  initialRating?: number;
  sendImmediately?: boolean;
}



