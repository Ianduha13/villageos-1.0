-- VillageOS — Phase B (Proofs). Evidence attached to a claim (Claim → Proof).
-- The artifact lives in storage; `uri` references it. Adds proof.attached.

DO $$ BEGIN
  CREATE TYPE "proof_type" AS ENUM (
    'image', 'document', 'link', 'observation', 'measurement', 'testimony', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "proofs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id" uuid NOT NULL REFERENCES "claims"("id"),
  "proof_type" "proof_type" NOT NULL DEFAULT 'link',
  "uri" text NOT NULL,
  "description" text,
  "validator_id" uuid REFERENCES "persons"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "proofs_claim_idx" ON "proofs" ("claim_id");
