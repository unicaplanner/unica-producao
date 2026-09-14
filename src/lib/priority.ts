import { businessDaysBetween } from "./businessDays";

export type Priority = "atrasado" | "sai_hoje" | "sai_amanha" | "no_prazo";

export const PRIORITY_LABEL: Record<Priority, string> = {
  atrasado: "Atrasado",
  sai_hoje: "Sai hoje",
  sai_amanha: "Sai amanhã",
  no_prazo: "No prazo",
};

// Ordem de urgencia, do mais critico ao menos critico.
export const PRIORITY_ORDER: Priority[] = ["atrasado", "sai_hoje", "sai_amanha", "no_prazo"];

// prazoLimite = data do pedido + 15 dias uteis (o teto do prazo de 10-15
// dias uteis). Calculado em relacao a "agora" toda vez que a pagina
// renderiza, entao fica sempre atualizado mesmo entre sincronizacoes.
export function getPriority(prazoLimite: Date, now: Date = new Date()): Priority {
  const diasRestantes = businessDaysBetween(now, prazoLimite);

  if (diasRestantes < 0) return "atrasado";
  if (diasRestantes === 0) return "sai_hoje";
  if (diasRestantes === 1) return "sai_amanha";
  return "no_prazo";
}
