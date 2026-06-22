import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { persons } from "@/db/schema";

/*
 * Minimal session auth for the Phase-1 slice.
 *
 * Identity is role-based (design discussion DQ4), shaped so DID/VC can drop in
 * later behind this same boundary. A session is just the person id stored in an
 * httpOnly cookie after onboarding; later phases can swap in a signed token /
 * IdP without changing call sites that use getCurrentPerson().
 */

const SESSION_COOKIE = "villageos_session";

export async function setSession(personId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, personId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionPersonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentPerson() {
  const id = await getSessionPersonId();
  if (!id) return null;
  const [person] = await getDb()
    .select()
    .from(persons)
    .where(eq(persons.id, id))
    .limit(1);
  return person ?? null;
}
