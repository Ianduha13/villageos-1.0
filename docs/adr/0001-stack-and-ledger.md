# ADR-0001 — Stack & the append-only Reality Ledger

- Status: accepted
- Date: 2026-06-22
- Phase: 1 (Foundation)

## Context

VillageOS is a greenfield, mobile-first consumer "arena operating system" for a
village/hostel community (first arena: Barra da Lagoa). The thesis chain
(Reality → Observation → Claim → Proof → Trust → Coordination → Stewardship →
Assets → More Life) rests on three primitives: **Arena + Ledger + Stewardship**.
The whole stack must provision via Terraform on any cloud or a local sovereign
node, and the IA da Vila must be advisory only — never deciding.

## Decision

**Stack.** One full-stack Next.js (App Router, TypeScript) app served as a
mobile-first PWA; Tailwind + design tokens harvested from the 12 mockups; a
separate worker process for async IA da Vila. Data lives in PostgreSQL 16 +
pgvector via Drizzle ORM + SQL migrations. Proof artifacts go to S3-compatible
object storage (MinIO local → managed S3). Redis carries async AI jobs. The
inference backend sits behind a config-driven adapter (Ollama local → hosted
OpenAI-compatible), advisory only. Terraform is the single orchestrator: a
`local-docker` module from Phase 1, a cloud module in Phase 9.

**Reality Ledger.** Every important mutation appends a row to an **append-only
`events` table**. Balances (Infinitos), reputation, community-health, and
CCI-style metrics are all **derived views** over that ledger — there is no
second source of truth. The substrate is `withEvent(db, mutate, eventSpec)`
(`db/ledger.ts`): it runs the domain mutation and appends the event inside one
transaction, so "no mutation without a ledger entry" is atomic. Every later
phase (claims, proofs, offers/∞, ai_insights, assets, missions) adds rows and
event types onto this same spine.

**Identity.** Role-based (`persons.relation` ∈ Morador / Trabalha aqui /
Parceiro local / Visitante recorrente; `persons.role` for access), with a
`credentials` jsonb seam so DID/VC can drop in later behind the same boundary.
Sessions are an httpOnly cookie holding the person id (`lib/auth.ts`).

## Consequences

- Derived-state correctness depends on the ledger being complete; all domain
  writes must go through `withEvent`. This is enforced by convention now and by
  the worker's restricted DB grant (Phase 5) and metric reconciliation tests.
- The single-transaction guarantee ties the event to its mutation, preventing
  drift between domain rows and history.
- Provider/adapter boundaries (inference now; identity/federation later) keep
  swappable concerns a config change, not a code change.
