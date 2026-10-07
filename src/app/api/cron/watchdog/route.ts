import { NextResponse } from "next/server";
import { getSyncStatus, hoursSince, STALE_AFTER_HOURS } from "@/lib/syncStatus";
import { sendAlertEmail } from "@/lib/email";

// Roda 1x/dia, algumas horas depois do sync. Cobre o caso que o proprio sync
// nao consegue avisar: ele nem ter rodado (cron desligado, deploy quebrado,
// projeto pausado) -- nesse caso nao existe "falha" pra reportar, so silencio.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const status = await getSyncStatus();
  const horas = hoursSince(status?.lastSuccessAt);
  const atrasado = horas === null || horas > STALE_AFTER_HOURS;

  if (atrasado) {
    await sendAlertEmail(
      "Central de Producao: os dados estao desatualizados",
      [
        horas === null
          ? "A Central de Producao ainda nunca registrou uma sincronizacao bem-sucedida."
          : `A ultima sincronizacao bem-sucedida com o Shopify foi ha ${Math.round(horas)} horas.`,
        status?.lastError ? `Ultimo erro registrado: ${status.lastError}` : "Nenhum erro registrado (o sync pode nem ter rodado).",
        "",
        "Os pedidos que aparecem na Central podem estar desatualizados.",
        "Abra o app e use 'Sincronizar agora'. Se nao resolver, me chame.",
      ].join("\n")
    );
  }

  return NextResponse.json({ ok: true, atrasado, horasDesdeUltimoSucesso: horas });
}
