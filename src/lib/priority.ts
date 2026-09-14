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

// Mapeia cada prioridade pra uma das 3 cores do design system aprovado
// (vinho/ocre/oliva) -- sai_hoje e sai_amanha dividem o tom "ocre" porque
// so existem 3 cores de status no visual, nao 4.
export type PriorityTone = "vinho" | "ocre" | "oliva";

export const PRIORITY_TONE: Record<Priority, PriorityTone> = {
  atrasado: "vinho",
  sai_hoje: "ocre",
  sai_amanha: "ocre",
  no_prazo: "oliva",
};

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

export function getDiasRestantes(prazoLimite: Date, now: Date = new Date()): number {
  return businessDaysBetween(now, prazoLimite);
}

// Texto curto pra coluna "prazo" das tabelas -- ex: "3d atrasado", "hoje",
// "amanhã", "+5d uteis".
export function formatDiasRestantes(diasRestantes: number): string {
  if (diasRestantes < 0) return `${Math.abs(diasRestantes)}d atrasado`;
  if (diasRestantes === 0) return "hoje";
  if (diasRestantes === 1) return "amanhã";
  return `+${diasRestantes}d úteis`;
}
