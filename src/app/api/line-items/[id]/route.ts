import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Marca/desmarca um item de linha como produzido. O vinculo com o pedido de
// origem (orderId) nunca muda aqui -- so o status de producao.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { produzido } = await req.json();

  const lineItem = await prisma.lineItem.update({
    where: { id },
    data: {
      statusProducao: produzido ? "produzido" : "pendente",
      dataProducao: produzido ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, lineItem });
}
