import { prisma } from "./prisma";
import { type CustomAttribute, type ProductGroup } from "./productGroups";

export async function getOpenOrders() {
  return prisma.order.findMany({
    where: { stillOpenInShopify: true },
    include: { lineItems: { orderBy: { title: "asc" } } },
    orderBy: { prazoLimite: "asc" },
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { title: "asc" } } },
  });
}

// Agrupa os itens de linha ainda pendentes (de pedidos abertos) por
// produto+variante, somando a quantidade total e listando de quais pedidos
// vem cada parte -- e a visao "produzir em lote".
export async function getPendingGroupedByProduct(): Promise<ProductGroup[]> {
  const pendingItems = await prisma.lineItem.findMany({
    where: {
      statusProducao: "pendente",
      order: { stillOpenInShopify: true },
    },
    include: { order: true },
  });

  const groups = new Map<string, ProductGroup>();

  for (const item of pendingItems) {
    const key = `${item.title}::${item.variantTitle ?? ""}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: item.title,
        variantTitle: item.variantTitle,
        quantidadePendente: 0,
        pedidos: [],
      });
    }
    const group = groups.get(key)!;
    group.quantidadePendente += item.quantity;
    group.pedidos.push({
      lineItemId: item.id,
      orderId: item.orderId,
      orderName: item.order.name,
      prazoLimite: item.order.prazoLimite,
      quantity: item.quantity,
      customAttributes: (item.customAttributes as CustomAttribute[] | null) ?? [],
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.quantidadePendente - a.quantidadePendente);
}
