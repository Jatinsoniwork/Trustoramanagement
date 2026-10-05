import { clientRepository } from "@/server/repositories/clientRepository";
import { activityRepository } from "@/server/repositories/activityRepository";
import { clientSchema, ClientInput } from "@/lib/validation/client.schema";
import { Client, ClientStatus } from "@/types";

export const clientService = {
  async getClients(query?: { search?: string; status?: ClientStatus }): Promise<Client[]> {
    return clientRepository.findAll(query);
  },

  async getClientById(id: string): Promise<Client | null> {
    return clientRepository.findById(id);
  },

  async createClient(input: ClientInput, actorId?: string): Promise<Client> {
    // Server-side validation via Zod
    const validated = clientSchema.parse(input);
    const client = await clientRepository.create(validated);

    // Audit log
    await activityRepository.log({
      actorId,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      metadata: {
        clientName: client.name,
        contactName: client.contactName,
        email: client.email,
      },
    });

    return client;
  },

  async updateClient(
    id: string,
    input: Partial<ClientInput>,
    actorId?: string
  ): Promise<Client | null> {
    const updated = await clientRepository.update(id, input);
    if (updated) {
      await activityRepository.log({
        actorId,
        action: "CLIENT_UPDATED",
        entityType: "Client",
        entityId: id,
        metadata: {
          clientName: updated.name,
          status: updated.status,
        },
      });
    }
    return updated;
  },

  async deactivateClient(id: string, actorId?: string): Promise<boolean> {
    const success = await clientRepository.deactivate(id);
    if (success) {
      await activityRepository.log({
        actorId,
        action: "CLIENT_DEACTIVATED",
        entityType: "Client",
        entityId: id,
      });
    }
    return success;
  },
};
