import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cria uma caixa nova e vincula esse pedido a ela -- e o "iniciar
// embalagem" de um pedido que ainda nao tem caixa nenhuma.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.boxId) {
    return NextResponse.json({ error: "Esse pedido já tem uma caixa." }, { status: 409 });
  }

  const box = await prisma.box.create({
    data: { orders: { connect: { id: orderId } } },
  });

  return NextResponse.json({ ok: true, box });
}
