import { redirect } from "next/navigation";
import { getCurrentPerson } from "@/lib/auth";

// Reads the session cookie — render per request.
export const dynamic = "force-dynamic";

// Root: an authenticated, validated villager goes straight to Vila Agora;
// everyone else starts the invite/onboarding flow.
export default async function Home() {
  let person = null;
  try {
    person = await getCurrentPerson();
  } catch {
    // DATABASE_URL absent (e.g. static build) — fall through to onboarding.
  }
  if (person?.status === "active") redirect("/inicio");
  redirect("/onboarding");
}
