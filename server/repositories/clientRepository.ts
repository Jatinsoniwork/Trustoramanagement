import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { DEMO_CLIENTS } from "@/lib/data/mockData";
import { Client, ClientStatus } from "@/types";
import { ClientInput } from "@/lib/validation/client.schema";

export const clientRepository = {
  async findAll(query?: { search?: string; status?: ClientStatus }): Promise<Client[]> {
    if (!isDatabaseConfigured()) {
      let filtered = [...DEMO_CLIENTS];
      if (query?.status) {
        filtered = filtered.filter((c) => c.status === query.status);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.contactName.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
    try {
      const where: {
        status?: "ACTIVE" | "INACTIVE";
        OR?: Array<{ name?: { contains: string; mode: "insensitive" } } | { contactName?: { contains: string; mode: "insensitive" } }>;
      } = {};

      if (query?.status) {
        where.status = query.status;
      }

      if (query?.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { contactName: { contains: query.search, mode: "insensitive" } },
        ];
      }

      const clients = await prisma.client.findMany({
        where,
        include: {
          businesses: true,
          _count: {
            select: { businesses: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return clients as unknown as Client[];
    } catch {
      // Graceful fallback to development demo data
      let filtered = [...DEMO_CLIENTS];
      if (query?.status) {
        filtered = filtered.filter((c) => c.status === query.status);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.contactName.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  async findById(id: string): Promise<Client | null> {
    if (!isDatabaseConfigured()) {
      const found = DEMO_CLIENTS.find((c) => c.id === id);
      return found || null;
    }
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          businesses: {
            include: {
              _count: {
                select: { reviewRequests: true },
              },
            },
          },
        },
      });
      return client as unknown as Client | null;
    } catch {
      const found = DEMO_CLIENTS.find((c) => c.id === id);
      return found || null;
    }
  },

  async create(data: ClientInput): Promise<Client> {
    try {
      const created = await prisma.client.create({
        data: {
          name: data.name,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          notes: data.notes ?? null,
          status: data.status,
        },
      });
      return created as unknown as Client;
    } catch {
      const fallback: Client = {
        id: `client-${Date.now()}`,
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { businesses: 0 },
      };
      DEMO_CLIENTS.unshift(fallback);
      return fallback;
    }
  },

  async update(id: string, data: Partial<ClientInput>): Promise<Client | null> {
    try {
      const updated = await prisma.client.update({
        where: { id },
        data: {
          ...data,
          notes: data.notes === undefined ? undefined : data.notes,
        },
      });
      return updated as unknown as Client;
    } catch {
      const idx = DEMO_CLIENTS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        DEMO_CLIENTS[idx] = {
          ...DEMO_CLIENTS[idx],
          ...data,
          updatedAt: new Date(),
        };
        return DEMO_CLIENTS[idx];
      }
      return null;
    }
  },

  async deactivate(id: string): Promise<boolean> {
    try {
      await prisma.client.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
      return true;
    } catch {
      const client = DEMO_CLIENTS.find((c) => c.id === id);
      if (client) {
        client.status = "INACTIVE";
        return true;
      }
      return false;
    }
  },
};
