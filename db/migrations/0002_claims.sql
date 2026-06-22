-- VillageOS — Phase A (Claims). Structured statements about reality on the
-- same Arena + Reality Ledger spine. Adds claim.created / claim.status_changed.

DO $$ BEGIN
  CREATE TYPE "claim_type" AS ENUM (
    'observation', 'need', 'proposal', 'risk', 'decision_request'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "claim_status" AS ENUM (
    'open', 'needs_proof', 'under_review', 'verified', 'decided', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "arena_id" uuid NOT NULL REFERENCES "arenas"("id"),
  "author_id" uuid REFERENCES "persons"("id"),
  "title" text NOT NULL,
  "statement" text,
  "type" "claim_type" NOT NULL DEFAULT 'observation',
  "status" "claim_status" NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "claims_arena_idx" ON "claims" ("arena_id");
CREATE INDEX IF NOT EXISTS "claims_status_idx" ON "claims" ("status");
