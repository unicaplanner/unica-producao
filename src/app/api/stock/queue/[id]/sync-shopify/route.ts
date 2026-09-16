import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adjustInventoryQuantity } from "@/lib/shopify";

// So chamada depois que a usuaria confirma explicitamente na tela que quer
// somar as unidades produzidas ao estoque real do Shopify. Soma
// producedQuantity (o que de fato foi produzido, nao o alvo) ao estoque
// disponivel da variante.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await prisma.stockQueueItem.findUnique({ where: { id }, include: { variant: true } });
  if (!item) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }
  if (!item.variant) {
    return NextResponse.json(
      { error: "Esse item não está ligado a uma variante do Shopify." },
      { status: 409 }
    );
  }
  if (item.sincronizadoComShopify) {
    return NextResponse.json({ error: "Esse item já foi sincronizado." }, { status: 409 });
  }
  if (item.producedQuantity <= 0) {
    return NextResponse.json({ error: "Nada foi produzido ainda." }, { status: 409 });
  }

  try {
    await adjustInventoryQuantity(item.variant.inventoryItemId, item.producedQuantity);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido ao ajustar estoque." },
      { status: 502 }
    );
  }

  const [updatedItem] = await prisma.$transaction([
    prisma.stockQueueItem.update({
      where: { id },
      data: { sincronizadoComShopify: true, sincronizadoEm: new Date() },
    }),
    prisma.variant.update({
      where: { id: item.variant.id },
      data: { inventoryQuantity: { increment: item.producedQuantity } },
    }),
  ]);

  return NextResponse.json({ ok: true, item: updatedItem });
}
