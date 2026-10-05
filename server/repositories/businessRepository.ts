import { prisma, isDatabaseAvailable, markDatabaseFailure, markDatabaseSuccess } from "@/lib/db/prisma";
import { Business, BusinessStatus } from "@/types";
import { BusinessInput } from "@/lib/validation/business.schema";

export const businessRepository = {
  async findAll(query?: {
    clientId?: string;
    status?: BusinessStatus;
    search?: string;
  }): Promise<Business[]> {
    if (!isDatabaseAvailable()) {
      return [];
    }
    try {
      const where: {
        clientId?: string;
        status?: "ACTIVE" | "INACTIVE";
        OR?: Array<
          | { name?: { contains: string; mode: "insensitive" } }
          | { category?: { contains: string; mode: "insensitive" } }
          | { location?: { contains: string; mode: "insensitive" } }
        >;
      } = {};

      if (query?.clientId) where.clientId = query.clientId;
      if (query?.status) where.status = query.status;
      if (query?.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { category: { contains: query.search, mode: "insensitive" } },
          { location: { contains: query.search, mode: "insensitive" } },
        ];
      }

      const businesses = await prisma.business.findMany({
        where,
        include: {
          client: true,
          _count: {
            select: { reviewRequests: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      markDatabaseSuccess();
      return businesses as unknown as Business[];
    } catch (error) {
      markDatabaseFailure();
      console.error("Error finding businesses from database:", error);
      return [];
    }
  },

  async findById(id: string): Promise<Business | null> {
    if (!isDatabaseAvailable()) {
      return null;
    }
    try {
      const business = await prisma.business.findUnique({
        where: { id },
        include: {
          client: true,
          reviewRequests: {
            include: {
              googleAccount: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      markDatabaseSuccess();
      return (business as unknown as Business) || null;
    } catch (error) {
      markDatabaseFailure();
      console.error(`Error finding business by id ${id}:`, error);
      return null;
    }
  },

  async create(data: BusinessInput): Promise<Business> {
    const created = await prisma.business.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        googleMapsUrl: data.googleMapsUrl,
        googleReviewUrl: data.googleReviewUrl ?? null,
        placeIdentifier: data.placeIdentifier ?? null,
        category: data.category,
        location: data.location,
        notes: data.notes ?? null,
        status: data.status,
      },
      include: {
        client: true,
        _count: {
          select: { reviewRequests: true },
        },
      },
    });
    markDatabaseSuccess();
    return created as unknown as Business;
  },

  async update(id: string, data: Partial<BusinessInput>): Promise<Business | null> {
    try {
      const updated = await prisma.business.update({
        where: { id },
        data: {
          ...data,
          placeIdentifier: data.placeIdentifier === undefined ? undefined : data.placeIdentifier,
          notes: data.notes === undefined ? undefined : data.notes,
        },
        include: {
          client: true,
          _count: {
            select: { reviewRequests: true },
          },
        },
      });
      markDatabaseSuccess();
      return (updated as unknown as Business) || null;
    } catch (error) {
      markDatabaseFailure();
      console.error(`Error updating business ${id}:`, error);
      return null;
    }
  },
};
