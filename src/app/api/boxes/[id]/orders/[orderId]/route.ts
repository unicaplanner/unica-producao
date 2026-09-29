import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tira um pedido da caixa. Toda ordem sempre tem uma caixa (nunca fica sem
// nenhuma), entao aqui ela ganha uma caixa solo nova em vez de ficar null.
// Se a caixa antiga ficar sem nenhum pedido, apaga ela.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const { id: boxId, orderId } = await params;

  const novaCaixa = await prisma.box.create({ data: {} });
  await prisma.order.update({ where: { id: orderId }, data: { boxId: novaCaixa.id } });

  const remaining = await prisma.order.count({ where: { boxId } });
  if (remaining === 0) {
    await prisma.box.delete({ where: { id: boxId } });
    return NextResponse.json({ ok: true, boxDeleted: true, novoBoxId: novaCaixa.id });
  }

  return NextResponse.json({ ok: true, boxDeleted: false, novoBoxId: novaCaixa.id });
}
