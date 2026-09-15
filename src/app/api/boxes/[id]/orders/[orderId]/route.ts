import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tira um pedido da caixa. Se a caixa ficar sem nenhum pedido, apaga ela
// tambem -- nao faz sentido uma caixa vazia sobrar no banco.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  const { id: boxId, orderId } = await params;

  await prisma.order.update({ where: { id: orderId }, data: { boxId: null } });

  const remaining = await prisma.order.count({ where: { boxId } });
  if (remaining === 0) {
    await prisma.box.delete({ where: { id: boxId } });
    return NextResponse.json({ ok: true, boxDeleted: true });
  }

  return NextResponse.json({ ok: true, boxDeleted: false });
}
