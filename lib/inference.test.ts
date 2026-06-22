import { describe, it, expect } from "vitest";
import { createInferenceAdapter, stubResponse } from "@/lib/inference";

/* Unit — no network. The stub provider and offline fallback are deterministic. */
describe("inference adapter", () => {
  it("exposes provider + model from env", () => {
    const a = createInferenceAdapter({
      LLM_PROVIDER: "stub",
      LLM_CHAT_MODEL: "llama3.2",
    });
    expect(a.provider).toBe("stub");
    expect(a.model).toBe("llama3.2");
  });

  it("returns deterministic advisory text for the stub provider", async () => {
    const a = createInferenceAdapter({ LLM_PROVIDER: "stub" });
    const out = await a.chat("Resuma esta ação");
    expect(out.length).toBeGreaterThan(0);
  });

  it("tailors the stub by intent", () => {
    expect(stubResponse("liste as provas que faltam")).toMatch(/anexe/i);
    expect(stubResponse("sugira a próxima ação")).toMatch(/steward|comunidade decide/i);
  });
});
