import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

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
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Erro na sincronizacao com Shopify:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
