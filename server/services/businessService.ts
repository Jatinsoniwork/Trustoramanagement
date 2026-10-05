import { businessRepository } from "@/server/repositories/businessRepository";
import { activityRepository } from "@/server/repositories/activityRepository";
import { businessSchema, BusinessInput } from "@/lib/validation/business.schema";
import { Business, BusinessStatus } from "@/types";

export const businessService = {
  async getBusinesses(query?: {
    clientId?: string;
    status?: BusinessStatus;
    search?: string;
  }): Promise<Business[]> {
    return businessRepository.findAll(query);
  },

  async getBusinessById(id: string): Promise<Business | null> {
    return businessRepository.findById(id);
  },

  async createBusiness(input: BusinessInput, actorId?: string): Promise<Business> {
    const validated = businessSchema.parse(input);
    const business = await businessRepository.create(validated);

    await activityRepository.log({
      actorId,
      action: "BUSINESS_CREATED",
      entityType: "Business",
      entityId: business.id,
      metadata: {
        businessName: business.name,
        category: business.category,
        location: business.location,
      },
    });

    return business;
  },

  async updateBusiness(
    id: string,
    input: Partial<BusinessInput>,
    actorId?: string
  ): Promise<Business | null> {
    const updated = await businessRepository.update(id, input);
    if (updated) {
      await activityRepository.log({
        actorId,
        action: "BUSINESS_UPDATED",
        entityType: "Business",
        entityId: id,
        metadata: {
          businessName: updated.name,
          status: updated.status,
        },
      });
    }
    return updated;
  },
};
