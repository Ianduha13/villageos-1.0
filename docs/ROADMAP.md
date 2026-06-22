# VillageOS 1.0 — Roadmap to the First Proof

Thesis v0.2 (*Stewardship Infrastructure*: Arena + Ledger + Stewardship). First arena: **Barra da Lagoa**.
The **First Proof** (thesis §9/§13): *a human–AI claim-and-proof system improves coordination versus chat-only*.

## Built — Phase 1 (Foundation)

`arenas / persons / invites` + the append-only **Reality Ledger** (`events`), the `withEvent` atomic substrate
(`db/ledger.ts`), the **onboarding** slice (invite → identity → community validation → `active`), Testcontainers
integration, and the Terraform `local-docker` stack.

## Building — the First-Proof slice

Each phase = a SQL migration + a domain service (always through `withEvent`) + Next.js server actions/pages +
a Testcontainers integration test, mirroring the onboarding slice. Commit + push per phase.

| Phase | Adds | Ledger events |
|---|---|---|
| **A — Claims** | `claims` + `lib/claims.ts` + `/criar`, `/vila` (feed), `/claims/[id]` | `claim.created`, `claim.status_changed` |
| **B — Proofs** | `proofs` + `lib/storage.ts` (S3/MinIO + local fallback) + attach UI | `proof.attached` |
| **C — IA da Vila** | `lib/inference.ts` adapter + `ai_insights` (advisory, `pending`, **never decides**) | `ai_insight.created` |
| **D — Decisions + Metrics** | human-only `decisions` + `lib/metrics.ts` (ledger-derived CCI-style index) + dashboard + JSON/CSV export | `decision.created` |

## Scope

**In:** claims, proofs, advisory text-only AI (`claim_summary` / `missing_proofs` / `next_action`), human-only
decisions, ledger-derived metrics, export. **IA da Vila is advisory only — it never writes a decision or a final
claim status; insights enter `pending`.**

**Deferred:** offers/Infinitos (∞), assets, missions, geo, federation/DID-VC, the cloud Terraform module, a
separately-hardened worker DB grant, E2E/DAST.

**Deploy:** Tier 1 — Terraform `local-docker`; LLM via the config adapter (hosted default; Ollama optional offline).

## Patterns (from the scaffold — follow exactly)

- Every mutation goes through `withEvent(db, mutate, eventSpec)` — never a bare insert/update.
- Drizzle `pgEnum` + a paired idempotent `.sql` migration; `gen_random_uuid()`.
- `"use server"` actions + App Router `(shell)` group; actor id from `lib/auth.ts`.
- Testcontainers `pgvector/pgvector:pg16` + `applyMigrations`, asserting rows **and** ledger events.
- pt-BR, mobile-first, design tokens, existing components.

See `docs/mockups/` for the 12 source mockups the UI and tokens derive from.
