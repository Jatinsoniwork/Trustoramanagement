"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BusinessTable } from "@/components/businesses/business-table";
import { BusinessFormModal } from "@/components/businesses/business-form-modal";
import { Business, Client } from "@/types";
import { BusinessInput } from "@/lib/validation/business.schema";

export interface BusinessesContentProps {
  initialBusinesses: Business[];
  clients: Client[];
}

export function BusinessesContent({
  initialBusinesses,
  clients,
}: BusinessesContentProps) {
  const [businesses, setBusinesses] = React.useState<Business[]>(initialBusinesses);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [businessToEdit, setBusinessToEdit] = React.useState<Business | null>(null);

  const handleOpenAdd = () => {
    setBusinessToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (biz: Business) => {
    setBusinessToEdit(biz);
    setIsModalOpen(true);
  };

  const handleSaveBusiness = async (data: BusinessInput) => {
    const parentClient = clients.find((c) => c.id === data.clientId);

    if (businessToEdit) {
      const res = await fetch(`/api/businesses/${businessToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update business");
      }
      const updated = await res.json();
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === businessToEdit.id
            ? {
                ...b,
                ...updated.data,
                client: parentClient || b.client,
              }
            : b
        )
      );
    } else {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create business");
      }
      const created = await res.json();
      const newBiz: Business = {
        ...created.data,
        client: parentClient,
        _count: { reviewRequests: 0 },
      };
      setBusinesses((prev) => [newBiz, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        subtitle="Manage verified business locations and Google Maps entities operated on behalf of clients."
      >
        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="gap-1.5 shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Add Business</span>
        </Button>
      </PageHeader>

      <BusinessTable
        initialBusinesses={businesses}
        onAddBusiness={handleOpenAdd}
        onEditBusiness={handleOpenEdit}
      />

      <BusinessFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clients={clients}
        businessToEdit={businessToEdit}
        onSubmit={handleSaveBusiness}
      />
    </div>
  );
}
