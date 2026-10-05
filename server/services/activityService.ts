import { activityRepository } from "@/server/repositories/activityRepository";
import { ActivityLog, ActivityAction } from "@/types";

export const activityService = {
  async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    return activityRepository.findAll({ limit });
  },

  async getAllLogs(query?: {
    action?: ActivityAction;
    entityType?: string;
    limit?: number;
  }): Promise<ActivityLog[]> {
    return activityRepository.findAll(query);
  },
};
