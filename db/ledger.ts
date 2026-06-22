import { events, type NewEvent } from "./schema";
import type { Database } from "./client";

/*
 * The Reality Ledger substrate — the universal pattern every later phase reuses.
 *
 * `withEvent(tx, mutate, eventSpec)` performs a domain mutation AND appends the
 * corresponding append-only `events` row inside a SINGLE transaction. Because
 * every balance, reputation score, community-health indicator and CCI-style
 * metric is a DERIVED view over `events`, the invariant "no mutation without a
 * ledger entry" must be atomic — hence one transaction, never two writes.
 */

export type EventSpec = {
  arenaId?: string | null;
  eventType: string;
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

// `tx` is the transaction handle Drizzle passes into db.transaction(...).
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function appendEvent(tx: Tx, spec: EventSpec) {
  const row: NewEvent = {
    arenaId: spec.arenaId ?? null,
    eventType: spec.eventType,
    actorId: spec.actorId ?? null,
    entityType: spec.entityType,
    entityId: spec.entityId ?? null,
    payload: spec.payload ?? {},
  };
  const [inserted] = await tx.insert(events).values(row).returning();
  return inserted;
}

/**
 * Run a domain mutation and atomically append its ledger event.
 *
 * `mutate` receives the transaction so its writes share the same tx as the
 * event append. It may return any value (e.g. the inserted domain row), which
 * is passed through. If the spec needs the mutation's result (e.g. a generated
 * id), pass a function for `event` instead of a static object.
 */
export async function withEvent<T>(
  db: Database,
  mutate: (tx: Tx) => Promise<T>,
  event: EventSpec | ((result: T) => EventSpec),
): Promise<T> {
  return db.transaction(async (tx) => {
    const result = await mutate(tx);
    const spec = typeof event === "function" ? event(result) : event;
    await appendEvent(tx, spec);
    return result;
  });
}
