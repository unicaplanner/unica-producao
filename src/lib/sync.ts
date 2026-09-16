import { prisma } from "./prisma";
import {
  fetchOpenOrders,
  fetchAllVariants,
  adminOrderUrl,
  personalizationAttributes,
  type ShopifyOrder,
} from "./shopify";
import { addBusinessDays } from "./businessDays";

const SLA_DIAS_UTEIS = 15;

function orderData(order: ShopifyOrder, domain: string) {
  return {
    name: order.name,
    orderDate: new Date(order.createdAt),
    prazoLimite: addBusinessDays(new Date(order.createdAt), SLA_DIAS_UTEIS),
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : null,
    closedAt: order.closedAt ? new Date(order.closedAt) : null,
    totalPrice: order.currentTotalPriceSet.shopMoney.amount,
    currency: order.currentTotalPriceSet.shopMoney.currencyCode,
    shippingMethod: order.shippingLine?.title ?? null,
    adminUrl: adminOrderUrl(domain, order.id),
    stillOpenInShopify: true,
    lastSyncedAt: new Date(),
  };
}

export interface SyncResult {
  ordersSynced: number;
  lineItemsSynced: number;
  ordersClosed: number;
  variantsSynced: number;
  variantsError: string | null;
}

// Busca pedidos em aberto no Shopify e faz merge com o banco local:
// - Cria/atualiza pedidos e itens com os dados vindos do Shopify.
// - NUNCA sobrescreve statusProducao/dataProducao de um LineItem ja existente
//   -- esse e o unico dado que o Shopify nao tem e que precisa sobreviver
//   entre sincronizacoes.
// - Pedidos que sumiram do "status:open" (foram cumpridos ou cancelados)
//   sao marcados como stillOpenInShopify = false, pra sair das telas de
//   pedidos abertos sem que a gente precise reconsultar cada um.
export async function runSync(): Promise<SyncResult> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN nao configurado.");

  const openOrders = await fetchOpenOrders();
  const seenShopifyIds: string[] = [];
  let lineItemsSynced = 0;

  for (const order of openOrders) {
    seenShopifyIds.push(order.id);
    const data = orderData(order, domain);

    const dbOrder = await prisma.order.upsert({
      where: { shopifyId: order.id },
      create: { shopifyId: order.id, ...data },
      update: data,
    });

    for (const edge of order.lineItems.edges) {
      const li = edge.node;
      const customAttributes = personalizationAttributes(li);
      await prisma.lineItem.upsert({
        where: { shopifyId: li.id },
        create: {
          shopifyId: li.id,
          orderId: dbOrder.id,
          title: li.title,
          variantTitle: li.variantTitle,
          sku: li.sku,
          quantity: li.quantity,
          customAttributes,
          lastSyncedAt: new Date(),
        },
        update: {
          orderId: dbOrder.id,
          title: li.title,
          variantTitle: li.variantTitle,
          sku: li.sku,
          quantity: li.quantity,
          customAttributes,
          lastSyncedAt: new Date(),
        },
      });
      lineItemsSynced += 1;
    }
  }

  const { count: ordersClosed } = await prisma.order.updateMany({
    where: {
      stillOpenInShopify: true,
      shopifyId: { notIn: seenShopifyIds.length > 0 ? seenShopifyIds : ["__none__"] },
    },
    data: { stillOpenInShopify: false, lastSyncedAt: new Date() },
  });

  // Sincronizar estoque e independente de pedidos -- se o token ainda nao
  // tem escopo read_products, isso nao pode derrubar o sync de pedidos que
  // ja funcionou.
  let variantsSynced = 0;
  let variantsError: string | null = null;
  try {
    variantsSynced = await syncVariants();
  } catch (err) {
    variantsError = err instanceof Error ? err.message : "Erro desconhecido ao sincronizar estoque.";
  }

  return {
    ordersSynced: openOrders.length,
    lineItemsSynced,
    ordersClosed,
    variantsSynced,
    variantsError,
  };
}

// Atualiza a foto de estoque de todas as variantes -- so a quantidade em
// si; nao mexe em nada da fila de producao de estoque (StockQueueItem).
async function syncVariants(): Promise<number> {
  const variants = await fetchAllVariants();

  for (const v of variants) {
    await prisma.variant.upsert({
      where: { shopifyVariantId: v.id },
      create: {
        shopifyVariantId: v.id,
        inventoryItemId: v.inventoryItem.id,
        productTitle: v.productTitle,
        variantTitle: v.title === "Default Title" ? null : v.title,
        sku: v.sku,
        inventoryQuantity: v.inventoryQuantity ?? 0,
        lastSyncedAt: new Date(),
      },
      update: {
        inventoryItemId: v.inventoryItem.id,
        productTitle: v.productTitle,
        variantTitle: v.title === "Default Title" ? null : v.title,
        sku: v.sku,
        inventoryQuantity: v.inventoryQuantity ?? 0,
        lastSyncedAt: new Date(),
      },
    });
  }

  return variants.length;
}
