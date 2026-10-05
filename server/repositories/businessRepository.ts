import { prisma, isDatabaseAvailable, markDatabaseFailure, markDatabaseSuccess } from "@/lib/db/prisma";
import { DEMO_BUSINESSES } from "@/lib/data/mockData";
import { Business, BusinessStatus } from "@/types";
import { BusinessInput } from "@/lib/validation/business.schema";

export const businessRepository = {
  async findAll(query?: {
    clientId?: string;
    status?: BusinessStatus;
    search?: string;
  }): Promise<Business[]> {
    if (!isDatabaseAvailable()) {
      let filtered = [...DEMO_BUSINESSES];
      if (query?.clientId) {
        filtered = filtered.filter((b) => b.clientId === query.clientId);
      }
      if (query?.status) {
        filtered = filtered.filter((b) => b.status === query.status);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.location.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
    try {
      const where: {
        clientId?: string;
        status?: "ACTIVE" | "INACTIVE";
        OR?: Array<{ name?: { contains: string; mode: "insensitive" } } | { category?: { contains: string; mode: "insensitive" } } | { location?: { contains: string; mode: "insensitive" } }>;
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
    } catch {
      markDatabaseFailure();
      let filtered = [...DEMO_BUSINESSES];
      if (query?.clientId) {
        filtered = filtered.filter((b) => b.clientId === query.clientId);
      }
      if (query?.status) {
        filtered = filtered.filter((b) => b.status === query.status);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.location.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  async findById(id: string): Promise<Business | null> {
    if (!isDatabaseAvailable()) {
      const found = DEMO_BUSINESSES.find((b) => b.id === id);
      return found || null;
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
      return business as unknown as Business | null;
    } catch {
      markDatabaseFailure();
      const found = DEMO_BUSINESSES.find((b) => b.id === id);
      return found || null;
    }
  },

  async create(data: BusinessInput): Promise<Business> {
    if (!isDatabaseAvailable()) {
      const fallback: Business = {
        id: `biz-${Date.now()}`,
        clientId: data.clientId,
        name: data.name,
        googleMapsUrl: data.googleMapsUrl,
        googleReviewUrl: data.googleReviewUrl ?? null,
        placeIdentifier: data.placeIdentifier,
        category: data.category,
        location: data.location,
        notes: data.notes,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { reviewRequests: 0 },
      };
      DEMO_BUSINESSES.unshift(fallback);
      return fallback;
    }
    try {
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
      });
      markDatabaseSuccess();
      return created as unknown as Business;
    } catch {
      markDatabaseFailure();
      const fallback: Business = {
        id: `biz-${Date.now()}`,
        clientId: data.clientId,
        name: data.name,
        googleMapsUrl: data.googleMapsUrl,
        googleReviewUrl: data.googleReviewUrl ?? null,
        placeIdentifier: data.placeIdentifier,
        category: data.category,
        location: data.location,
        notes: data.notes,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { reviewRequests: 0 },
      };
      DEMO_BUSINESSES.unshift(fallback);
      return fallback;
    }
  },

  async update(id: string, data: Partial<BusinessInput>): Promise<Business | null> {
    if (!isDatabaseAvailable()) {
      const idx = DEMO_BUSINESSES.findIndex((b) => b.id === id);
      if (idx !== -1) {
        DEMO_BUSINESSES[idx] = {
          ...DEMO_BUSINESSES[idx],
          ...data,
          updatedAt: new Date(),
        };
        return DEMO_BUSINESSES[idx];
      }
      return null;
    }
    try {
      const updated = await prisma.business.update({
        where: { id },
        data: {
          ...data,
          placeIdentifier: data.placeIdentifier === undefined ? undefined : data.placeIdentifier,
          notes: data.notes === undefined ? undefined : data.notes,
        },
      });
      markDatabaseSuccess();
      return updated as unknown as Business;
    } catch {
      markDatabaseFailure();
      const idx = DEMO_BUSINESSES.findIndex((b) => b.id === id);
      if (idx !== -1) {
        DEMO_BUSINESSES[idx] = {
          ...DEMO_BUSINESSES[idx],
          ...data,
          updatedAt: new Date(),
        };
        return DEMO_BUSINESSES[idx];
      }
      return null;
    }
  },
};
