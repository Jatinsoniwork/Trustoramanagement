"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Plus, Edit2, Mail, Phone, Calendar, MapPin, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { BusinessFormModal } from "@/components/businesses/business-form-modal";
import { formatDate } from "@/lib/utils/formatters";
import { Client, Business, ReviewRequest } from "@/types";
import { ClientInput } from "@/lib/validation/client.schema";
import { BusinessInput } from "@/lib/validation/business.schema";

export interface ClientDetailContentProps {
  initialClient: Client;
  associatedBusinesses: Business[];
  associatedReviews: ReviewRequest[];
}

export function ClientDetailContent({
  initialClient,
  associatedBusinesses,
  associatedReviews,
}: ClientDetailContentProps) {
  const [client, setClient] = React.useState<Client>(initialClient);
  const [businesses, setBusinesses] = React.useState<Business[]>(associatedBusinesses);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isAddBizOpen, setIsAddBizOpen] = React.useState(false);

  const handleUpdateClient = async (data: ClientInput) => {
    setClient((prev) => ({
      ...prev,
      ...data,
      updatedAt: new Date(),
    }));
  };

  const handleAddBusiness = async (data: BusinessInput) => {
    const newBiz: Business = {
      id: `biz-${Date.now()}`,
      clientId: client.id,
      name: data.name,
      googleMapsUrl: data.googleMapsUrl,
      placeIdentifier: data.placeIdentifier,
      category: data.category,
      location: data.location,
      notes: data.notes,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      client,
      _count: { reviewRequests: 0 },
    };
    setBusinesses((prev) => [newBiz, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Clients</span>
        </Link>
      </div>

      <PageHeader
        title={client.name}
        subtitle="Detailed client account dossier and affiliated physical business entities."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditOpen(true)}
          className="gap-1.5"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit Client</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddBizOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Business</span>
        </Button>
      </PageHeader>

      {/* Client Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Client Profile</CardTitle>
              <Badge variant={client.status === "ACTIVE" ? "success" : "neutral"}>
                {client.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Primary Contact</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100 mt-0.5">
                {client.contactName}
              </p>
            </div>

            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              <span>{client.email}</span>
            </div>

            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Phone className="h-3.5 w-3.5 text-zinc-400" />
              <span>{client.phone}</span>
            </div>

            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Onboarded: {formatDate(client.createdAt)}</span>
            </div>

            {client.notes && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 block text-[11px] mb-1">Operator Notes</span>
                <p className="text-zinc-600 dark:text-zinc-300 italic bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Associated Businesses & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Businesses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">
                  Associated Businesses ({businesses.length})
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddBizOpen(true)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </Button>
            </CardHeader>
            <CardContent>
              {businesses.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No businesses registered for this client yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {businesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/businesses/${biz.id}`}
                          className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:underline"
                        >
                          {biz.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          <span>{biz.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {biz.location}
                          </span>
                        </div>
                      </div>
                      <Link href={`/businesses/${biz.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Associated Review Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">
                  Review Workflows ({associatedReviews.length})
                </CardTitle>
              </div>
              <Link href="/review-requests/new">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Create Request</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {associatedReviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No review requests created for this client yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {associatedReviews.map((r) => (
                    <div
                      key={r.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {r.experience}
                        </p>
                        <span className="text-[11px] text-zinc-400">
                          {formatDate(r.createdAt)} • Rating: {r.rating}★
                        </span>
                      </div>
                      <Link href={`/review-requests/${r.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        clientToEdit={client}
        onSubmit={handleUpdateClient}
      />

      <BusinessFormModal
        isOpen={isAddBizOpen}
        onClose={() => setIsAddBizOpen(false)}
        clients={[client]}
        defaultClientId={client.id}
        onSubmit={handleAddBusiness}
      />
    </div>
  );
}
