"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ClientTable } from "@/components/clients/client-table";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Client } from "@/types";
import { ClientInput } from "@/lib/validation/client.schema";

export interface ClientsContentProps {
  initialClients: Client[];
}

export function ClientsContent({ initialClients }: ClientsContentProps) {
  const [clients, setClients] = React.useState<Client[]>(initialClients);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [clientToEdit, setClientToEdit] = React.useState<Client | null>(null);
  const [clientToDeactivate, setClientToDeactivate] = React.useState<Client | null>(null);

  const handleOpenAdd = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (data: ClientInput) => {
    if (clientToEdit) {
      const res = await fetch(`/api/clients/${clientToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update client");
      }
      const updated = await res.json();
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientToEdit.id ? { ...c, ...updated.data } : c
        )
      );
    } else {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create client");
      }
      const created = await res.json();
      const newClient: Client = {
        ...created.data,
        _count: { businesses: 0 },
      };
      setClients((prev) => [newClient, ...prev]);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!clientToDeactivate) return;
    try {
      const res = await fetch(`/api/clients/${clientToDeactivate.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientToDeactivate.id ? { ...c, status: "INACTIVE" } : c
          )
        );
      }
    } catch (e) {
      console.error("Failed to deactivate client", e);
    } finally {
      setClientToDeactivate(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Manage businesses and accounts you operate on behalf of."
      >
        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="gap-1.5 shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </PageHeader>

      <ClientTable
        initialClients={clients}
        onAddClient={handleOpenAdd}
        onEditClient={handleOpenEdit}
        onDeactivateClient={(client) => setClientToDeactivate(client)}
      />

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={clientToEdit}
        onSubmit={handleSaveClient}
      />

      <ConfirmationDialog
        isOpen={!!clientToDeactivate}
        onClose={() => setClientToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Client"
        description={`Are you sure you want to deactivate "${clientToDeactivate?.name}"? Associated businesses will be marked inactive.`}
        confirmLabel="Deactivate"
        isDestructive
      />
    </div>
  );
}
