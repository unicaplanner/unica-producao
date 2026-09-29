import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Agrupa outro pedido nessa caixa. Toda ordem ja nasce com uma caixa propria
// (so ela dentro), entao "agrupar" quase sempre significa: tirar o pedido
// da caixa solo dele e jogar nessa aqui, apagando a caixa solo que sobrou
// vazia. So recusa se o pedido de origem ja estiver numa caixa de verdade
// (com outros pedidos dentro) -- aí e um agrupamento existente que nao dá
// pra desfazer silenciosamente.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boxId } = await params;
  const { orderId } = await req.json();

  if (typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId inválido." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { box: { include: { orders: { select: { id: true } } } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.boxId === boxId) {
    return NextResponse.json({ error: "Esse pedido já está nessa caixa." }, { status: 409 });
  }
  if (order.box && order.box.orders.length > 1) {
    return NextResponse.json(
      { error: "Esse pedido já está agrupado com outro(s) numa caixa diferente." },
      { status: 409 }
    );
  }

  const caixaAntigaId = order.boxId;
  await prisma.order.update({ where: { id: orderId }, data: { boxId } });
  if (caixaAntigaId) {
    await prisma.box.delete({ where: { id: caixaAntigaId } }).catch(() => {});
  }

  const box = await prisma.box.findUnique({
    where: { id: boxId },
    include: { orders: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ ok: true, box });
}
