import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Agrupa outro pedido (que ainda nao tem caixa) nessa mesma caixa.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boxId } = await params;
  const { orderId } = await req.json();

  if (typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId inválido." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.boxId) {
    return NextResponse.json(
      { error: "Esse pedido já está em outra caixa." },
      { status: 409 }
    );
  }

  await prisma.order.update({ where: { id: orderId }, data: { boxId } });

  const box = await prisma.box.findUnique({
    where: { id: boxId },
    include: { orders: { orderBy: { name: "asc" } } },
  });

  return NextResponse.json({ ok: true, box });
}
