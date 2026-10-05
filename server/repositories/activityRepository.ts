import { prisma, isDatabaseAvailable, markDatabaseFailure, markDatabaseSuccess } from "@/lib/db/prisma";
import { DEMO_ACTIVITY_LOGS } from "@/lib/data/mockData";
import { ActivityLog, ActivityAction } from "@/types";
import { redactSensitiveObject } from "@/lib/security/tokens";
import { Prisma } from "@prisma/client";

export const activityRepository = {
  async findAll(query?: {
    action?: ActivityAction;
    entityType?: string;
    businessId?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    if (!isDatabaseAvailable()) {
      let filtered = [...DEMO_ACTIVITY_LOGS];
      if (query?.action) {
        filtered = filtered.filter((l) => l.action === query.action);
      }
      if (query?.entityType) {
        filtered = filtered.filter((l) => l.entityType === query.entityType);
      }
      if (query?.businessId) {
        filtered = filtered.filter(
          (l) => !l.metadata || (l.metadata as Record<string, unknown>).businessId === query.businessId
        );
      }
      return filtered.slice(0, query?.limit ?? 50);
    }
    try {
      const where: {
        action?: ActivityAction;
        entityType?: string;
      } = {};

      if (query?.action) where.action = query.action;
      if (query?.entityType) where.entityType = query.entityType;

      const logs = await prisma.activityLog.findMany({
        where: where as unknown as Prisma.ActivityLogWhereInput,
        take: query?.limit ?? 50,
        include: {
          actor: true,
        },
        orderBy: { createdAt: "desc" },
      });

      markDatabaseSuccess();
      return logs as unknown as ActivityLog[];
    } catch {
      markDatabaseFailure();
      let filtered = [...DEMO_ACTIVITY_LOGS];
      if (query?.action) {
        filtered = filtered.filter((l) => l.action === query.action);
      }
      if (query?.entityType) {
        filtered = filtered.filter((l) => l.entityType === query.entityType);
      }
      if (query?.businessId) {
        filtered = filtered.filter(
          (l) => !l.metadata || (l.metadata as Record<string, unknown>).businessId === query.businessId
        );
      }
      return filtered.slice(0, query?.limit ?? 50);
    }
  },

  async log(data: {
    actorId?: string;
    action: ActivityAction;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<ActivityLog> {
    const safeMetadata = data.metadata ? redactSensitiveObject(data.metadata) : null;

    if (!isDatabaseAvailable()) {
      const fallback: ActivityLog = {
        id: `act-${Date.now()}`,
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: safeMetadata,
        createdAt: new Date(),
        actor: {
          id: data.actorId || "operator-1",
          name: "Primary Operator",
          email: "operator@reviewflow.local",
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      DEMO_ACTIVITY_LOGS.unshift(fallback);
      return fallback;
    }

    try {
      const created = await prisma.activityLog.create({
        data: {
          actorId: data.actorId ?? null,
          action: data.action as unknown as Prisma.ActivityLogCreateInput["action"],
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: safeMetadata ? (safeMetadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
        include: { actor: true },
      });
      markDatabaseSuccess();
      return created as unknown as ActivityLog;
    } catch {
      markDatabaseFailure();
      const fallback: ActivityLog = {
        id: `act-${Date.now()}`,
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: safeMetadata,
        createdAt: new Date(),
        actor: {
          id: data.actorId || "operator-1",
          name: "Primary Operator",
          email: "operator@reviewflow.local",
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      DEMO_ACTIVITY_LOGS.unshift(fallback);
      return fallback;
    }
  },
};
