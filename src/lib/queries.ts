import { prisma } from "./prisma";
import { type CustomAttribute, type ProductGroup, type ProductInfoData } from "./productGroups";

// Pedido "em aberto pra produção" = ainda aberto no Shopify E com
// pagamento aprovado. Pedido pendente/expirado/autorizado (nao PAID) nao
// entra em nenhuma tela daqui -- so aparece se/quando o pagamento cair.
const OPEN_PAID = { stillOpenInShopify: true, financialStatus: "PAID" } as const;

export async function getOpenOrders() {
  return prisma.order.findMany({
    where: OPEN_PAID,
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

// Candidatos pra agrupar na mesma caixa de um pedido: qualquer outro
// pedido aberto pago que ainda nao esteja nessa mesma caixa (toda ordem ja
// nasce com uma caixa propria, entao "candidato" nao significa mais "sem
// caixa nenhuma" -- significa "numa caixa diferente da minha").
export async function getGroupableOpenOrders(excludeOrderId: string, excludeBoxId: string | null) {
  return prisma.order.findMany({
    where: {
      ...OPEN_PAID,
      id: { not: excludeOrderId },
      ...(excludeBoxId ? { boxId: { not: excludeBoxId } } : {}),
    },
    select: { id: true, name: true, boxId: true, customerId: true },
    orderBy: { name: "asc" },
  });
}

// Outros pedidos abertos pagos do mesmo cliente (mesmo customerId), ainda
// nao agrupados na mesma caixa -- vira a sugestao "agrupar na mesma caixa?"
// na tela do pedido. So usa o id do cliente (nunca nome/email), que e o
// unico dado de cliente que nosso app consegue ler no plano Basic.
export async function getSameCustomerCandidates(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, boxId: true },
  });
  if (!order?.customerId) return [];

  return prisma.order.findMany({
    where: {
      ...OPEN_PAID,
      customerId: order.customerId,
      id: { not: orderId },
      ...(order.boxId ? { boxId: { not: order.boxId } } : {}),
    },
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
      order: OPEN_PAID,
    },
    include: { order: true },
  });

  const nomes = await getCustomerNames(pendingItems.map((i) => i.order.customerId));
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
      orderDate: item.order.orderDate,
      clienteNome: (item.order.customerId && nomes[item.order.customerId]) || null,
      prazoLimite: item.order.prazoLimite,
      quantity: item.quantity,
      customAttributes: (item.customAttributes as CustomAttribute[] | null) ?? [],
    });
  }

  // Dentro de cada produto: pedido mais antigo (prazo mais proximo) primeiro.
  for (const g of groups.values()) {
    g.pedidos.sort(
      (a, b) =>
        a.prazoLimite.getTime() - b.prazoLimite.getTime() || a.orderName.localeCompare(b.orderName)
    );
  }

  return Array.from(groups.values()).sort((a, b) => b.quantidadePendente - a.quantidadePendente);
}

// Mapa titulo do produto -> pagina no site, vinda do Shopify na
// sincronizacao (so existe se o produto esta publicado no site).
export async function getAutoSiteUrls(): Promise<Record<string, string>> {
  const rows = await prisma.shopifyProduct.findMany({
    where: { url: { not: null } },
    select: { title: true, url: true },
  });
  return Object.fromEntries(rows.map((r) => [r.title, r.url as string]));
}

// Mapa chave-do-grupo -> informacoes cadastradas (PDF, site, especificacoes).
export async function getProductInfo(): Promise<Record<string, ProductInfoData>> {
  const rows = await prisma.productInfo.findMany();
  return Object.fromEntries(
    rows.map((r) => [r.key, { printUrl: r.printUrl, siteUrl: r.siteUrl, specs: r.specs }])
  );
}

// Mapa customerId do Shopify -> nome digitado a mao (so os que ja tem nome).
export async function getCustomerNames(
  customerIds: (string | null | undefined)[]
): Promise<Record<string, string>> {
  const ids = Array.from(new Set(customerIds.filter((id): id is string => !!id)));
  if (ids.length === 0) return {};
  const rows = await prisma.customer.findMany({ where: { id: { in: ids } } });
  return Object.fromEntries(rows.map((r) => [r.id, r.nome]));
}
