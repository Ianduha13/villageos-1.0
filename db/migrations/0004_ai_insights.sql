-- VillageOS — Phase C (IA da Vila). Advisory AI insights on a claim. The AI
-- never decides: it writes ai_insights + events only, each insight `pending`
-- with full provenance. Adds ai_insight.created / ai_insight.reviewed.

DO $$ BEGIN
  CREATE TYPE "insight_type" AS ENUM (
    'claim_summary', 'missing_proofs', 'next_action'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "human_review_status" AS ENUM (
    'pending', 'accepted', 'rejected', 'edited'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "ai_insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id" uuid NOT NULL REFERENCES "claims"("id"),
  "insight_type" "insight_type" NOT NULL,
  "content" text NOT NULL,
  "model_provider" text NOT NULL,
  "model_name" text NOT NULL,
  "prompt_version" text NOT NULL,
  "human_review_status" "human_review_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ai_insights_claim_idx" ON "ai_insights" ("claim_id");
