import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { recordSyncFailure, recordSyncSuccess } from "@/lib/syncStatus";
import { sendAlertEmail } from "@/lib/email";

// Chamado 1x/dia pelo Vercel Cron (ver vercel.json). O proprio Vercel manda
// o header Authorization: Bearer <CRON_SECRET> quando a env var CRON_SECRET
// esta configurada no projeto -- e assim que autenticamos essa rota, que
// fica fora do middleware de sessao (ela nao tem cookie de ninguem).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const result = await runSync();
    await recordSyncSuccess();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Erro na sincronizacao com Shopify:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await recordSyncFailure(message).catch(() => {});
    await sendAlertEmail(
      "Central de Producao: a sincronizacao com o Shopify falhou",
      [
        "A sincronizacao automatica de hoje com o Shopify deu erro.",
        "Enquanto isso a Central continua mostrando os dados do ultimo dia que deu certo.",
        "",
        `Erro: ${message.slice(0, 400)}`,
        "",
        "Tente o botao 'Sincronizar agora' no app. Se o erro continuar, me chame.",
      ].join("\n")
    );
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
