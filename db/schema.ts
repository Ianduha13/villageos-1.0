import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/*
 * VillageOS schema — Phase 1 (Foundation).
 *
 * The thesis chain (Reality → Observation → Claim → Proof → Trust →
 * Coordination → Stewardship → Assets → More Life) rests on three primitives:
 * Arena + Ledger + Stewardship. Phase 1 stands up:
 *   - `arenas`  — the bounded context where reality is tested (first: Barra).
 *   - `persons` — role-based identity (DID/VC-shaped for later).
 *   - `events`  — the APPEND-ONLY Reality Ledger. Every important mutation
 *                 appends here; balances, reputation, health and CCI-style
 *                 metrics are all DERIVED views over this table. No second
 *                 source of truth.
 *   - `invites` — village invite tokens redeemed during onboarding.
 *
 * Later phases (claims, proofs, offers, ledger_entries, ai_insights, assets,
 * missions, geo) add rows + event types onto this same spine.
 */

// Arena types — a hostel is an arena type with assets, not a reservations
// product (design discussion DQ3).
export const arenaType = pgEnum("arena_type", [
  "village",
  "hostel",
  "coliving",
  "org",
]);

// Identity relation to the arena (mockup Screen 2 chips) + derived roles.
// Kept as a fixed taxonomy now, shaped so DID/VC can populate `credentials`.
export const personRelation = pgEnum("person_relation", [
  "morador", // Morador
  "trabalha_aqui", // Trabalha aqui
  "parceiro_local", // Parceiro local
  "visitante_recorrente", // Visitante recorrente
]);

// Onboarding/community-validation status for a person.
export const personStatus = pgEnum("person_status", [
  "invited", // token redeemed, identity not yet created
  "pending_validation", // identity created, awaiting community validation
  "active", // validation passed — full villager access
]);

export const arenas = pgTable("arenas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: arenaType("type").notNull().default("village"),
  // Federation: every record carries a sovereign origin (signed import/export
  // is a later phase; the stamp is reserved now).
  originCell: text("origin_cell"),
  did: text("did"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  arenaId: uuid("arena_id")
    .notNull()
    .references(() => arenas.id),
  handle: text("handle").notNull(), // @breno
  fullName: text("full_name"),
  bio: text("bio"),
  avatarUri: text("avatar_uri"),
  relation: personRelation("relation").notNull().default("morador"),
  // Derived role badges (Conector / Guardiã / Villager verificado) are computed
  // from events/proofs in Phase 7; the stored `role` is the access role.
  role: text("role").notNull().default("participant"),
  skills: jsonb("skills").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  offers: jsonb("offers").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  privacy: text("privacy").notNull().default("villagers"), // public | villagers | private
  status: personStatus("status").notNull().default("pending_validation"),
  // DID/VC drop-in seam — empty now.
  credentials: jsonb("credentials")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  originCell: text("origin_cell"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Village invite tokens (mockup Screen 1: "Código do convite BLG-2026-0148").
export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  arenaId: uuid("arena_id")
    .notNull()
    .references(() => arenas.id),
  token: text("token").notNull().unique(),
  invitedByName: text("invited_by_name"),
  redeemedByPersonId: uuid("redeemed_by_person_id").references(
    () => persons.id,
  ),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/*
 * The append-only Reality Ledger. NEVER updated or deleted in normal flow.
 * Phase 1 emits: person.invited, identity.created, validation.requested,
 * validation.recorded, person.activated. Later phases append their own types.
 */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  arenaId: uuid("arena_id").references(() => arenas.id),
  eventType: text("event_type").notNull(),
  actorId: uuid("actor_id"), // person who caused the mutation (nullable for system)
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  payload: jsonb("payload")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Arena = typeof arenas.$inferSelect;
export type NewArena = typeof arenas.$inferInsert;
export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

/*
 * --- Phase A: Claims -------------------------------------------------------
 * A claim is a structured statement about reality (thesis: Observation →
 * Claim). It rides the same Arena + Reality Ledger spine; creating or moving a
 * claim appends claim.created / claim.status_changed to `events`.
 */
export const claimType = pgEnum("claim_type", [
  "observation",
  "need",
  "proposal",
  "risk",
  "decision_request",
]);

export const claimStatus = pgEnum("claim_status", [
  "open",
  "needs_proof",
  "under_review",
  "verified",
  "decided",
  "archived",
]);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  arenaId: uuid("arena_id")
    .notNull()
    .references(() => arenas.id),
  authorId: uuid("author_id").references(() => persons.id),
  title: text("title").notNull(),
  statement: text("statement"),
  type: claimType("type").notNull().default("observation"),
  status: claimStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;

/*
 * --- Phase B: Proofs -------------------------------------------------------
 * Evidence attached to a claim (thesis: Claim → Proof). The binary artifact
 * lives in object storage / filesystem; `uri` references it. Attaching appends
 * proof.attached (and may move the claim to under_review).
 */
export const proofType = pgEnum("proof_type", [
  "image",
  "document",
  "link",
  "observation",
  "measurement",
  "testimony",
  "other",
]);

export const proofs = pgTable("proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id")
    .notNull()
    .references(() => claims.id),
  proofType: proofType("proof_type").notNull().default("link"),
  uri: text("uri").notNull(),
  description: text("description"),
  validatorId: uuid("validator_id").references(() => persons.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Proof = typeof proofs.$inferSelect;
export type NewProof = typeof proofs.$inferInsert;

/*
 * --- Phase C: AI insights (IA da Vila) -------------------------------------
 * Advisory AI output on a claim. The AI never decides: insights enter `pending`
 * and carry full provenance (model_provider / model_name / prompt_version).
 * Adds ai_insight.created / ai_insight.reviewed to the ledger.
 */
export const insightType = pgEnum("insight_type", [
  "claim_summary",
  "missing_proofs",
  "next_action",
]);

export const humanReviewStatus = pgEnum("human_review_status", [
  "pending",
  "accepted",
  "rejected",
  "edited",
]);

export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id")
    .notNull()
    .references(() => claims.id),
  insightType: insightType("insight_type").notNull(),
  content: text("content").notNull(),
  modelProvider: text("model_provider").notNull(),
  modelName: text("model_name").notNull(),
  promptVersion: text("prompt_version").notNull(),
  humanReviewStatus: humanReviewStatus("human_review_status")
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AiInsight = typeof aiInsights.$inferSelect;
export type NewAiInsight = typeof aiInsights.$inferInsert;
