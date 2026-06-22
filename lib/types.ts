// Shared domain types kept SDK-free so both the app and worker can import them.

export type PersonRelation =
  | "morador"
  | "trabalha_aqui"
  | "parceiro_local"
  | "visitante_recorrente";

export type PersonStatus = "invited" | "pending_validation" | "active";

export const RELATION_LABELS: Record<PersonRelation, string> = {
  morador: "Morador",
  trabalha_aqui: "Trabalha aqui",
  parceiro_local: "Parceiro local",
  visitante_recorrente: "Visitante recorrente",
};
