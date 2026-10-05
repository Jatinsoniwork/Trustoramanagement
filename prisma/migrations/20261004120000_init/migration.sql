-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GoogleAccountStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReviewRequestStatus" AS ENUM ('DRAFT', 'GENERATING', 'GENERATED', 'EDITED', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DEACTIVATED', 'BUSINESS_CREATED', 'BUSINESS_UPDATED', 'BUSINESS_DEACTIVATED', 'GOOGLE_ACCOUNT_CONNECTED', 'GOOGLE_ACCOUNT_DISCONNECTED', 'REVIEW_REQUEST_CREATED', 'REVIEW_REQUEST_UPDATED', 'REVIEW_GENERATED', 'REVIEW_EDITED', 'REVIEW_APPROVED', 'REVIEW_COMPLETED', 'SYSTEM_SETTING_UPDATED');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "googleMapsUrl" TEXT NOT NULL,
    "placeIdentifier" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "googleUserId" TEXT,
    "profileImageUrl" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "status" "GoogleAccountStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastConnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_requests" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "googleAccountId" TEXT,
    "experience" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "language" TEXT NOT NULL DEFAULT 'en',
    "tone" TEXT DEFAULT 'authentic',
    "keywords" TEXT,
    "requestedLength" TEXT DEFAULT 'standard',
    "status" "ReviewRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_drafts" (
    "id" TEXT NOT NULL,
    "reviewRequestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "businesses_clientId_idx" ON "businesses"("clientId");

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "google_accounts_email_key" ON "google_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "google_accounts_googleUserId_key" ON "google_accounts"("googleUserId");

-- CreateIndex
CREATE INDEX "google_accounts_status_idx" ON "google_accounts"("status");

-- CreateIndex
CREATE INDEX "google_accounts_email_idx" ON "google_accounts"("email");

-- CreateIndex
CREATE INDEX "review_requests_businessId_idx" ON "review_requests"("businessId");

-- CreateIndex
CREATE INDEX "review_requests_googleAccountId_idx" ON "review_requests"("googleAccountId");

-- CreateIndex
CREATE INDEX "review_requests_status_idx" ON "review_requests"("status");

-- CreateIndex
CREATE INDEX "review_requests_createdAt_idx" ON "review_requests"("createdAt");

-- CreateIndex
CREATE INDEX "review_drafts_reviewRequestId_idx" ON "review_drafts"("reviewRequestId");

-- CreateIndex
CREATE INDEX "review_drafts_isCurrent_idx" ON "review_drafts"("isCurrent");

-- CreateIndex
CREATE INDEX "activity_logs_actorId_idx" ON "activity_logs"("actorId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "google_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_reviewRequestId_fkey" FOREIGN KEY ("reviewRequestId") REFERENCES "review_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
