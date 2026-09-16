import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cria um item na fila de producao pra estoque. Pode vir de um clique em
// "Colocar na fila" (ja manda variantId) ou de uma adicao manual.
export async function POST(req: Request) {
  const { variantId, targetQuantity } = await req.json();

  if (typeof targetQuantity !== "number" || targetQuantity <= 0) {
    return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
  }
  if (typeof variantId !== "string") {
    return NextResponse.json({ error: "variantId inválido." }, { status: 400 });
  }

  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Variante não encontrada." }, { status: 404 });
  }

  const item = await prisma.stockQueueItem.create({
    data: {
      variantId: variant.id,
      productTitle: variant.productTitle,
      variantTitle: variant.variantTitle,
      sku: variant.sku,
      targetQuantity,
    },
  });

  return NextResponse.json({ ok: true, item });
}
