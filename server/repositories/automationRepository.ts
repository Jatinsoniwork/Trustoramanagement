import { AutomationSettings } from "@/types";

const defaultSettingsFor = (businessId: string): AutomationSettings => ({
  businessId,
  enabled: true,
  channel: "EMAIL",
  delayMinutes: 0,
  remindersEnabled: true,
  maxReminders: 2,
  reminderIntervalHours: 24,
  expirationDays: 7,
  smsSenderId: "ReviewFlow",
  emailSenderName: "ReviewFlow Assistant",
  customMessageTemplate: null,
  updatedAt: new Date(),
});

// In-memory settings store per businessId
const settingsStore = new Map<string, AutomationSettings>([
  [
    "demo-biz-1",
    {
      businessId: "demo-biz-1",
      enabled: true,
      channel: "EMAIL",
      delayMinutes: 0,
      remindersEnabled: true,
      maxReminders: 2,
      reminderIntervalHours: 24,
      expirationDays: 7,
      smsSenderId: "ArtisanCafe",
      emailSenderName: "Artisan Cafe & Roastery",
      customMessageTemplate: null,
      updatedAt: new Date("2026-10-01T09:00:00Z"),
    },
  ],
  [
    "demo-biz-2",
    {
      businessId: "demo-biz-2",
      enabled: true,
      channel: "SMS",
      delayMinutes: 0,
      remindersEnabled: true,
      maxReminders: 2,
      reminderIntervalHours: 24,
      expirationDays: 7,
      smsSenderId: "Hearthstone",
      emailSenderName: "Hearthstone Bistro",
      customMessageTemplate: null,
      updatedAt: new Date("2026-10-01T09:00:00Z"),
    },
  ],
  [
    "demo-biz-3",
    {
      businessId: "demo-biz-3",
      enabled: true,
      channel: "EMAIL",
      delayMinutes: 0,
      remindersEnabled: true,
      maxReminders: 2,
      reminderIntervalHours: 24,
      expirationDays: 7,
      smsSenderId: "SummitPT",
      emailSenderName: "Summit Physical Therapy",
      customMessageTemplate: null,
      updatedAt: new Date("2026-10-01T09:00:00Z"),
    },
  ],
]);

export const automationRepository = {
  async getSettings(businessId: string): Promise<AutomationSettings> {
    const existing = settingsStore.get(businessId);
    if (existing) {
      return { ...existing };
    }
    const def = defaultSettingsFor(businessId);
    settingsStore.set(businessId, def);
    return { ...def };
  },

  async updateSettings(
    businessId: string,
    updates: Partial<AutomationSettings>
  ): Promise<AutomationSettings> {
    const current = await this.getSettings(businessId);
    const updated: AutomationSettings = {
      ...current,
      ...updates,
      businessId, // immutable key
      maxReminders: Math.min(3, Math.max(0, updates.maxReminders ?? current.maxReminders)),
      reminderIntervalHours: Math.max(1, updates.reminderIntervalHours ?? current.reminderIntervalHours),
      expirationDays: Math.max(1, updates.expirationDays ?? current.expirationDays),
      delayMinutes: Math.max(0, updates.delayMinutes ?? current.delayMinutes),
      updatedAt: new Date(),
    };
    settingsStore.set(businessId, updated);
    return { ...updated };
  },

  async getAllSettings(): Promise<AutomationSettings[]> {
    return Array.from(settingsStore.values()).map((s) => ({ ...s }));
  },
};
