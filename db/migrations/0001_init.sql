-- VillageOS — Phase 1 (Foundation) schema.
-- Arena + role-based Identity + the append-only Reality Ledger (`events`).
-- Every later phase adds rows + event types onto this spine.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "arena_type" AS ENUM ('village', 'hostel', 'coliving', 'org');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "person_relation" AS ENUM (
    'morador', 'trabalha_aqui', 'parceiro_local', 'visitante_recorrente'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "person_status" AS ENUM (
    'invited', 'pending_validation', 'active'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "arenas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "type" "arena_type" NOT NULL DEFAULT 'village',
  "origin_cell" text,
  "did" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "persons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "arena_id" uuid NOT NULL REFERENCES "arenas"("id"),
  "handle" text NOT NULL,
  "full_name" text,
  "bio" text,
  "avatar_uri" text,
  "relation" "person_relation" NOT NULL DEFAULT 'morador',
  "role" text NOT NULL DEFAULT 'participant',
  "skills" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "offers" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "privacy" text NOT NULL DEFAULT 'villagers',
  "status" "person_status" NOT NULL DEFAULT 'pending_validation',
  "credentials" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "origin_cell" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "arena_id" uuid NOT NULL REFERENCES "arenas"("id"),
  "token" text NOT NULL UNIQUE,
  "invited_by_name" text,
  "redeemed_by_person_id" uuid REFERENCES "persons"("id"),
  "redeemed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- The append-only Reality Ledger. Source of truth for every derived view.
CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "arena_id" uuid REFERENCES "arenas"("id"),
  "event_type" text NOT NULL,
  "actor_id" uuid,
  "entity_type" text NOT NULL,
  "entity_id" uuid,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "events_entity_idx" ON "events" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" ("event_type");
CREATE INDEX IF NOT EXISTS "persons_arena_idx" ON "persons" ("arena_id");
