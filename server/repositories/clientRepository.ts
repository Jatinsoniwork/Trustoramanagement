import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { Client, ClientStatus } from "@/types";
import { ClientInput } from "@/lib/validation/client.schema";

export const clientRepository = {
  async findAll(query?: { search?: string; status?: ClientStatus }): Promise<Client[]> {
    if (!isDatabaseConfigured()) {
      return [];
    }
    try {
      const where: {
        status?: "ACTIVE" | "INACTIVE";
        OR?: Array<
          | { name?: { contains: string; mode: "insensitive" } }
          | { contactName?: { contains: string; mode: "insensitive" } }
        >;
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
    } catch (error) {
      console.error("Error finding clients from database:", error);
      return [];
    }
  },

  async findById(id: string): Promise<Client | null> {
    if (!isDatabaseConfigured()) {
      return null;
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
      return (client as unknown as Client) || null;
    } catch (error) {
      console.error(`Error finding client by id ${id}:`, error);
      return null;
    }
  },

  async create(data: ClientInput): Promise<Client> {
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
      return (updated as unknown as Client) || null;
    } catch (error) {
      console.error(`Error updating client ${id}:`, error);
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
    } catch (error) {
      console.error(`Error deactivating client ${id}:`, error);
      return false;
    }
  },
};
