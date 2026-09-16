import { prisma } from "./prisma";
import { type CustomAttribute, type ProductGroup } from "./productGroups";
import { LOW_STOCK_THRESHOLD } from "./stock";

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
    include: {
      lineItems: { orderBy: { title: "asc" } },
      box: { include: { orders: { orderBy: { name: "asc" } } } },
    },
  });
}

// Lista enxuta de pedidos abertos que ainda nao entraram em nenhuma caixa
// -- e o "candidatos pra agrupar" do seletor de caixa.
export async function getUnboxedOpenOrders() {
  return prisma.order.findMany({
    where: { stillOpenInShopify: true, boxId: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
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

// Variantes com estoque baixo que ainda nao tem uma fila de producao em
// andamento -- pra mostrar o botao "Colocar na fila" (se ja tem fila,
// mostra o progresso em vez do botao).
export async function getLowStockVariants() {
  return prisma.variant.findMany({
    where: { inventoryQuantity: { lt: LOW_STOCK_THRESHOLD } },
    include: {
      stockQueueItems: {
        where: { sincronizadoComShopify: false },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { inventoryQuantity: "asc" },
  });
}

export async function getStockQueue() {
  return prisma.stockQueueItem.findMany({
    orderBy: [{ concluido: "asc" }, { createdAt: "desc" }],
  });
}

// Lista enxuta de todas as variantes pra o seletor de "adicionar item a
// fila manualmente" (nao so as de estoque baixo).
export async function getAllVariantsBasic() {
  return prisma.variant.findMany({
    select: { id: true, productTitle: true, variantTitle: true, inventoryQuantity: true },
    orderBy: { productTitle: "asc" },
  });
}
