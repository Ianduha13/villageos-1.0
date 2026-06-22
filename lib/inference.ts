/*
 * Inference adapter — the IA da Vila boundary (NFR: domain code never imports an
 * LLM SDK). Config-driven by env so the backend is a config change, not a code
 * change: LLM_PROVIDER ∈ { local (Ollama), openai|hosted (OpenAI-compatible),
 * stub }. On any network error it falls back to a deterministic stub so the demo
 * still produces advisory text offline. Advisory only — it never decides.
 */
export type InferenceAdapter = {
  provider: string;
  model: string;
  chat(prompt: string): Promise<string>;
};

export function createInferenceAdapter(
  env: Record<string, string | undefined> = process.env,
): InferenceAdapter {
  const provider = env.LLM_PROVIDER ?? "local";
  const model = env.LLM_CHAT_MODEL ?? "llama3.2";
  const baseUrl = env.LLM_BASE_URL ?? "http://localhost:11434";
  const apiKey = env.LLM_API_KEY ?? "";

  return {
    provider,
    model,
    async chat(prompt: string): Promise<string> {
      if (provider === "stub") return stubResponse(prompt);
      try {
        if (provider === "openai" || provider === "hosted") {
          const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2,
            }),
          });
          const json = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          return (json.choices?.[0]?.message?.content ?? "").trim() || stubResponse(prompt);
        }
        // Ollama local chat API.
        const res = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        });
        const json = (await res.json()) as { message?: { content?: string } };
        return (json.message?.content ?? "").trim() || stubResponse(prompt);
      } catch {
        return stubResponse(prompt);
      }
    },
  };
}

/** Deterministic offline advisory — keeps the demo working without a live LLM. */
export function stubResponse(prompt: string): string {
  if (/provas? (que )?faltam|missing proof/i.test(prompt))
    return "Sugestão: anexe ao menos uma foto e um relato de testemunha para fortalecer esta ação.";
  if (/próxima ação|next action/i.test(prompt))
    return "Próxima ação sugerida: designar um steward responsável e definir um prazo de revisão. (A comunidade decide.)";
  return "Resumo: esta ação descreve uma situação da vila que precisa de validação da comunidade.";
}
