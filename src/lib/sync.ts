import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import {
  fetchOpenOrders,
  fetchAllProducts,
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
  productsSynced: number;
  productsError: string | null;
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

  // Sincronizar produtos (so pro link automatico do site) e independente
  // de pedidos -- se o token ainda nao tem escopo read_products, isso nao
  // pode derrubar o sync de pedidos que ja funcionou.
  let productsSynced = 0;
  let productsError: string | null = null;
  try {
    productsSynced = await syncProducts();
  } catch (err) {
    productsError = err instanceof Error ? err.message : "Erro desconhecido ao sincronizar produtos.";
  }

  return {
    ordersSynced: openOrders.length,
    lineItemsSynced,
    ordersClosed,
    productsSynced,
    productsError,
  };
}

// Atualiza titulo + link no site de todos os produtos -- so isso, pro
// "Link do site" automatico na tela Agrupado por item. Vai em lotes (um
// INSERT ... ON CONFLICT por lote) porque a loja tem centenas de produtos
// e gravar um por um levava minutos.
async function syncProducts(): Promise<number> {
  const products = await fetchAllProducts();
  const LOTE = 300;

  for (let i = 0; i < products.length; i += LOTE) {
    const lote = products.slice(i, i + LOTE);
    const ids = lote.map(() => randomUUID());
    const shopifyIds = lote.map((p) => p.id);
    const titles = lote.map((p) => p.title);
    const urls = lote.map((p) => p.onlineStoreUrl);

    await prisma.$executeRaw`
      INSERT INTO "ShopifyProduct"
        ("id", "shopifyProductId", "title", "url", "lastSyncedAt", "createdAt", "updatedAt")
      SELECT t.id, t.sp, t.title, t.url, now(), now(), now()
      FROM unnest(${ids}::text[], ${shopifyIds}::text[], ${titles}::text[], ${urls}::text[])
        AS t(id, sp, title, url)
      ON CONFLICT ("shopifyProductId") DO UPDATE SET
        "title" = EXCLUDED."title",
        "url" = EXCLUDED."url",
        "lastSyncedAt" = now(),
        "updatedAt" = now()
    `;
  }

  return products.length;
}
