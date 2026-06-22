import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { ensureArena } from "@/lib/onboarding";
import { computeMetrics } from "@/lib/metrics";
import { claims, proofs, aiInsights, decisions, events } from "@/db/schema";

export const dynamic = "force-dynamic";

/*
 * GET /export?format=json|csv — open the dataset for external research (thesis:
 * the arena is auditable). JSON = full dataset + metrics; CSV = the Reality
 * Ledger (events), the source of truth for every derived view.
 */
export async function GET(req: Request): Promise<Response> {
  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const db = getDb();
  const arena = await ensureArena(db);

  const arenaClaims = await db
    .select()
    .from(claims)
    .where(eq(claims.arenaId, arena.id));
  const ids = arenaClaims.map((c) => c.id);
  const arenaEvents = await db
    .select()
    .from(events)
    .where(eq(events.arenaId, arena.id));

  if (format === "csv") {
    const header = "id,event_type,entity_type,entity_id,created_at";
    const rows = arenaEvents.map((e) =>
      [
        e.id,
        e.eventType,
        e.entityType,
        e.entityId ?? "",
        e.createdAt.toISOString(),
      ].join(","),
    );
    return new Response([header, ...rows].join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="villageos-ledger.csv"',
      },
    });
  }

  const [arenaProofs, arenaInsights, arenaDecisions, metrics] = await Promise.all([
    ids.length
      ? db.select().from(proofs).where(inArray(proofs.claimId, ids))
      : Promise.resolve([]),
    ids.length
      ? db.select().from(aiInsights).where(inArray(aiInsights.claimId, ids))
      : Promise.resolve([]),
    ids.length
      ? db.select().from(decisions).where(inArray(decisions.claimId, ids))
      : Promise.resolve([]),
    computeMetrics(db, arena.id),
  ]);

  const dataset = {
    exportedAt: new Date().toISOString(),
    arena,
    metrics,
    claims: arenaClaims,
    proofs: arenaProofs,
    aiInsights: arenaInsights,
    decisions: arenaDecisions,
    events: arenaEvents,
  };

  return new Response(JSON.stringify(dataset, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="villageos-export.json"',
    },
  });
}
