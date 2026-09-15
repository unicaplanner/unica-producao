import { prisma } from "./prisma";

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

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface ProductGroup {
  key: string;
  title: string;
  variantTitle: string | null;
  quantidadePendente: number;
  pedidos: {
    lineItemId: string;
    orderId: string;
    orderName: string;
    prazoLimite: Date;
    quantity: number;
    customAttributes: CustomAttribute[];
  }[];
}

// Formata os atributos de personalizacao pra exibicao curta, ex:
// "text-1: Fé" ou "Cor: Azul, Nome: Ana" quando tem mais de um.
export function formatCustomAttributes(attrs: CustomAttribute[]): string | null {
  if (attrs.length === 0) return null;
  return attrs.map((a) => `${a.key}: ${a.value}`).join(", ");
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
