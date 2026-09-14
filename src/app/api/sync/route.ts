import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

// Botao "Sincronizar agora" da UI. Protegido pelo middleware de sessao
// normal (essa rota nao esta na lista de paths publicos).
export async function POST() {
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
