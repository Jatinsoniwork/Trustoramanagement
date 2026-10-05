import { NotificationLog } from "@/types";

// In-memory persistent store for development & mock environments
const notificationLogsStore: NotificationLog[] = [
  {
    id: "notif-demo-1",
    reviewRequestId: "demo-req-1",
    businessId: "demo-biz-1",
    channel: "EMAIL",
    recipient: "marcus.customer@example.com",
    subject: "How was your experience at Artisan Cafe & Roastery (Demo)?",
    message: "Thank you for visiting Artisan Cafe & Roastery (Demo). Please take 30 seconds to share your review: http://localhost:3000/review/request/tok-demo-cafe-01",
    type: "INITIAL",
    status: "SENT",
    attemptCount: 1,
    createdAt: new Date("2026-10-02T10:15:00Z"),
  },
  {
    id: "notif-demo-2",
    reviewRequestId: "demo-req-2",
    businessId: "demo-biz-2",
    channel: "SMS",
    recipient: "+15550192834",
    subject: null,
    message: "Hearthstone Bistro (Demo): Thank you for dining with us! We would love your feedback: http://localhost:3000/review/request/tok-demo-bistro-02 - Reply STOP to opt out",
    type: "INITIAL",
    status: "SENT",
    attemptCount: 1,
    createdAt: new Date("2026-10-03T18:40:00Z"),
  },
];

export const notificationRepository = {
  async create(
    data: Omit<NotificationLog, "id" | "createdAt"> & { createdAt?: Date }
  ): Promise<NotificationLog> {
    const log: NotificationLog = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: data.createdAt || new Date(),
    };
    notificationLogsStore.unshift(log);
    return log;
  },

  async findByRequestId(reviewRequestId: string): Promise<NotificationLog[]> {
    return notificationLogsStore.filter((l) => l.reviewRequestId === reviewRequestId);
  },

  async findByBusinessId(businessId: string): Promise<NotificationLog[]> {
    return notificationLogsStore.filter((l) => l.businessId === businessId);
  },

  async findAll(): Promise<NotificationLog[]> {
    return [...notificationLogsStore];
  },

  async count(businessId?: string): Promise<{ total: number; sent: number; failed: number }> {
    const list = businessId
      ? notificationLogsStore.filter((l) => l.businessId === businessId)
      : notificationLogsStore;
    return {
      total: list.length,
      sent: list.filter((l) => l.status === "SENT").length,
      failed: list.filter((l) => l.status === "FAILED").length,
    };
  },
};
