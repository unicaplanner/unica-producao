import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { recordSyncFailure, recordSyncSuccess } from "@/lib/syncStatus";

// Botao "Sincronizar agora" da UI. Protegido pelo middleware de sessao
// normal (essa rota nao esta na lista de paths publicos). Registra o
// resultado igual ao cron (pro indicador de "ultima sincronizacao"), mas nao
// manda e-mail: quem clicou ja esta olhando a tela e ve o erro na hora.
export async function POST() {
  try {
    const result = await runSync();
    await recordSyncSuccess();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Erro na sincronizacao com Shopify:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await recordSyncFailure(message).catch(() => {});
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
