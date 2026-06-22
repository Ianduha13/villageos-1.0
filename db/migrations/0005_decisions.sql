-- VillageOS — Phase D (Decisions). A human-recorded collective decision on a
-- claim (the AI never writes here). Recording one moves the claim to `decided`
-- and appends decision.created (+ claim.status_changed) to the Reality Ledger.

CREATE TABLE IF NOT EXISTS "decisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "claim_id" uuid NOT NULL REFERENCES "claims"("id"),
  "decided_by" uuid REFERENCES "persons"("id"),
  "decision" text NOT NULL,
  "rationale" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "decisions_claim_idx" ON "decisions" ("claim_id");
