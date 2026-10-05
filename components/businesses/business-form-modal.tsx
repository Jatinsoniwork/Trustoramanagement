"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { businessSchema, BusinessInput } from "@/lib/validation/business.schema";
import { Business, Client } from "@/types";

export interface BusinessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  businessToEdit?: Business | null;
  defaultClientId?: string;
  onSubmit: (data: BusinessInput) => Promise<void>;
}

function BusinessFormContent({
  clients,
  businessToEdit,
  defaultClientId,
  onClose,
  onSubmit,
}: {
  clients: Client[];
  businessToEdit?: Business | null;
  defaultClientId?: string;
  onClose: () => void;
  onSubmit: (data: BusinessInput) => Promise<void>;
}) {
  const [formData, setFormData] = React.useState<BusinessInput>(() => ({
    clientId:
      businessToEdit?.clientId ||
      defaultClientId ||
      (clients[0]?.id ?? ""),
    name: businessToEdit?.name || "",
    googleMapsUrl: businessToEdit?.googleMapsUrl || "",
    googleReviewUrl: businessToEdit?.googleReviewUrl || "",
    placeIdentifier: businessToEdit?.placeIdentifier || "",
    category: businessToEdit?.category || "",
    location: businessToEdit?.location || "",
    notes: businessToEdit?.notes || "",
    status: businessToEdit?.status || "ACTIVE",
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = businessSchema.safeParse(formData);
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
      setErrors({ form: "Failed to save business. Please check fields." });
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

      <Select
        label="Client Owner"
        value={formData.clientId}
        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
        error={errors.clientId}
        required
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Input
        label="Business Name"
        placeholder="e.g. Artisan Cafe & Roastery"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
      />

      <Input
        label="Google Maps Business URL"
        placeholder="https://maps.google.com/?cid=..."
        value={formData.googleMapsUrl}
        onChange={(e) =>
          setFormData({ ...formData, googleMapsUrl: e.target.value })
        }
        error={errors.googleMapsUrl}
        required
      />

      <Input
        label="Direct Google Review URL (Optional)"
        placeholder="https://g.page/r/.../review or https://search.google.com/local/writereview?placeid=..."
        value={formData.googleReviewUrl || ""}
        onChange={(e) =>
          setFormData({ ...formData, googleReviewUrl: e.target.value })
        }
        error={errors.googleReviewUrl}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Category"
          placeholder="e.g. Coffee Shop, Clinic"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          error={errors.category}
          required
        />

        <Input
          label="Google Place ID (Optional)"
          placeholder="ChIJ..."
          value={formData.placeIdentifier || ""}
          onChange={(e) =>
            setFormData({ ...formData, placeIdentifier: e.target.value })
          }
          error={errors.placeIdentifier}
        />
      </div>

      <Input
        label="Physical Location / Address"
        placeholder="e.g. 104 Main St, Austin, TX"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        error={errors.location}
        required
      />

      <Textarea
        label="Operational Notes (Optional)"
        placeholder="Operator observations, hours of operation, peak review times..."
        value={formData.notes || ""}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={2}
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
          {businessToEdit ? "Save Changes" : "Create Business"}
        </Button>
      </div>
    </form>
  );
}

export function BusinessFormModal({
  isOpen,
  onClose,
  clients,
  businessToEdit,
  defaultClientId,
  onSubmit,
}: BusinessFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={businessToEdit ? "Edit Business" : "Add Business"}
      description="Register a verified physical establishment or Google Maps location."
      maxWidth="md"
    >
      {isOpen && (
        <BusinessFormContent
          key={businessToEdit?.id ?? `new-biz-${defaultClientId ?? "default"}`}
          clients={clients}
          businessToEdit={businessToEdit}
          defaultClientId={defaultClientId}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}
