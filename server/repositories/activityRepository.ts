import { prisma, isDatabaseAvailable, markDatabaseFailure, markDatabaseSuccess } from "@/lib/db/prisma";
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
      return [];
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

      let result = logs as unknown as ActivityLog[];
      if (query?.businessId) {
        result = result.filter(
          (l) => !l.metadata || (l.metadata as Record<string, unknown>).businessId === query.businessId
        );
      }
      return result;
    } catch (error) {
      markDatabaseFailure();
      console.error("Error finding activity logs from database:", error);
      return [];
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
      const emptyLog: ActivityLog = {
        id: `act-${Date.now()}`,
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: safeMetadata,
        createdAt: new Date(),
      };
      return emptyLog;
    }

    try {
      let created;
      try {
        created = await prisma.activityLog.create({
          data: {
            actorId: data.actorId ?? null,
            action: data.action as unknown as Prisma.ActivityLogCreateInput["action"],
            entityType: data.entityType,
            entityId: data.entityId,
            metadata: safeMetadata ? (safeMetadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
          include: { actor: true },
        });
      } catch (fkError: unknown) {
        const isFk = typeof fkError === "object" && fkError !== null && "code" in fkError && (fkError as { code: string }).code === "P2003";
        if (isFk) {
          created = await prisma.activityLog.create({
            data: {
              actorId: null,
              action: data.action as unknown as Prisma.ActivityLogCreateInput["action"],
              entityType: data.entityType,
              entityId: data.entityId,
              metadata: safeMetadata ? (safeMetadata as Prisma.InputJsonValue) : Prisma.JsonNull,
            },
            include: { actor: true },
          });
        } else {
          throw fkError;
        }
      }
      markDatabaseSuccess();
      return created as unknown as ActivityLog;
    } catch (error) {
      markDatabaseFailure();
      console.error("Error writing activity log to database:", error);
      const fallback: ActivityLog = {
        id: `act-${Date.now()}`,
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: safeMetadata,
        createdAt: new Date(),
      };
      return fallback;
    }
  },
};
