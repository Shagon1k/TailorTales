-- Phase 12 — Admin Panel.
-- Add SUPER_ADMIN role (can change roles; ADMIN cannot) and account suspension.

-- AlterEnum: add SUPER_ADMIN to Role.
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable: suspension timestamp (null = active).
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
