"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { clientSchema, ClientInput } from "@/lib/validation/client.schema";
import { Client } from "@/types";

export interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onSubmit: (data: ClientInput) => Promise<void>;
}

function ClientFormContent({
  clientToEdit,
  onClose,
  onSubmit,
}: {
  clientToEdit?: Client | null;
  onClose: () => void;
  onSubmit: (data: ClientInput) => Promise<void>;
}) {
  const [formData, setFormData] = React.useState<ClientInput>(() => ({
    name: clientToEdit?.name || "",
    contactName: clientToEdit?.contactName || "",
    email: clientToEdit?.email || "",
    phone: clientToEdit?.phone || "",
    notes: clientToEdit?.notes || "",
    status: clientToEdit?.status || "ACTIVE",
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(result.data);
      onClose();
    } catch {
      setErrors({ form: "Failed to save client. Please check your data." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600 dark:text-rose-400">
          {errors.form}
        </div>
      )}

      <Input
        label="Client Organization Name"
        placeholder="e.g. Apex Hospitality Group"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Primary Contact Person"
          placeholder="e.g. Marcus Vance"
          value={formData.contactName}
          onChange={(e) =>
            setFormData({ ...formData, contactName: e.target.value })
          }
          error={errors.contactName}
          required
        />

        <Input
          label="Contact Email"
          type="email"
          placeholder="contact@client.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          required
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })
          }
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      <Textarea
        label="Internal Operator Notes"
        placeholder="Private operational notes (never shown to businesses or end-users)..."
        value={formData.notes || ""}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        error={errors.notes}
      />

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
          {clientToEdit ? "Save Changes" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}

export function ClientFormModal({
  isOpen,
  onClose,
  clientToEdit,
  onSubmit,
}: ClientFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? "Edit Client" : "Add New Client"}
      description="Manage the enterprise client for whom you operate review workflows."
      maxWidth="md"
    >
      {isOpen && (
        <ClientFormContent
          key={clientToEdit?.id ?? "new-client"}
          clientToEdit={clientToEdit}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}
