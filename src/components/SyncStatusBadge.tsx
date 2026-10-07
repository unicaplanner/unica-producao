import { getSyncStatus, hoursSince, STALE_AFTER_HOURS } from "@/lib/syncStatus";

function formatar(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "Ultima sincronizacao" -- vira laranja se ela falhou na ultima tentativa
// ou se faz mais de STALE_AFTER_HOURS que nao da certo (dado desatualizado).
export async function SyncStatusBadge() {
  const status = await getSyncStatus();
  const horas = hoursSince(status?.lastSuccessAt);
  const falhou =
    Boolean(status?.lastError) ||
    (status?.lastSuccessAt != null && horas !== null && horas > STALE_AFTER_HOURS);

  if (!status?.lastSuccessAt) {
    return (
      <span className="text-[11px] text-ocre">Ainda sem sincronização registrada</span>
    );
  }

  return (
    <span
      className={`text-[11px] ${falhou ? "font-semibold text-ocre" : "text-muted"}`}
      title={status.lastError ?? undefined}
    >
      {falhou ? "⚠ " : ""}Última sincronização: {formatar(status.lastSuccessAt)}
      {status.lastError ? " (a tentativa mais recente falhou)" : ""}
    </span>
  );
}
