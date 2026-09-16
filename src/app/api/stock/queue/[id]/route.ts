import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Atualiza quanto ja foi produzido de um item da fila. Marca concluido
// automaticamente quando produzido >= alvo (nao desmarca sozinho se depois
// abaixar de novo -- deixa a usuaria decidir).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { producedQuantity } = await req.json();

  if (typeof producedQuantity !== "number" || producedQuantity < 0) {
    return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
  }

  const current = await prisma.stockQueueItem.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }

  const item = await prisma.stockQueueItem.update({
    where: { id },
    data: {
      producedQuantity,
      concluido: current.concluido || producedQuantity >= current.targetQuantity,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.stockQueueItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
