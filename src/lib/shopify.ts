const API_VERSION = "2026-07";

function getConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!domain || !token) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN e SHOPIFY_ADMIN_ACCESS_TOKEN precisam estar configurados."
    );
  }
  return { domain, token };
}

async function shopifyGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { domain, token } = getConfig();
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    // Sempre buscar dados frescos direto do Shopify.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API respondeu ${res.status}: ${body}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL erro: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  customAttributes: { key: string; value: string }[];
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  cancelledAt: string | null;
  closedAt: string | null;
  shippingLine: { title: string } | null;
  currentTotalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: { edges: { node: ShopifyLineItem }[]; pageInfo: { hasNextPage: boolean } };
}

interface OrdersResponse {
  orders: {
    edges: { cursor: string; node: ShopifyOrder }[];
    pageInfo: { hasNextPage: boolean };
  };
}

const ORDERS_QUERY = /* GraphQL */ `
  query OpenOrders($cursor: String) {
    orders(
      first: 50
      after: $cursor
      query: "status:open"
      sortKey: CREATED_AT
    ) {
      edges {
        cursor
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          cancelledAt
          closedAt
          shippingLine {
            title
          }
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                variantTitle
                sku
                quantity
                customAttributes {
                  key
                  value
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

// Busca todos os pedidos em aberto do Shopify (status:open = nao arquivado,
// nao cancelado), paginando ate acabar. Limite de seguranca de 20 paginas
// (~1000 pedidos) pra nunca entrar num loop infinito por engano.
export async function fetchOpenOrders(): Promise<ShopifyOrder[]> {
  const orders: ShopifyOrder[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;
  let safety = 0;

  while (hasNextPage && safety < 20) {
    safety += 1;
    const data = await shopifyGraphQL<OrdersResponse>(ORDERS_QUERY, { cursor });
    for (const edge of data.orders.edges) {
      orders.push(edge.node);
      cursor = edge.cursor;
    }
    hasNextPage = data.orders.pageInfo.hasNextPage;
  }

  return orders;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku: string | null;
  inventoryQuantity: number | null;
  inventoryItem: { id: string };
  productTitle: string;
}

interface ProductsResponse {
  products: {
    edges: {
      cursor: string;
      node: {
        title: string;
        variants: { edges: { node: Omit<ShopifyVariant, "productTitle"> }[] };
      };
    }[];
    pageInfo: { hasNextPage: boolean };
  };
}

const PRODUCTS_QUERY = /* GraphQL */ `
  query AllProductVariants($cursor: String) {
    products(first: 50, after: $cursor) {
      edges {
        cursor
        node {
          title
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                inventoryQuantity
                inventoryItem {
                  id
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

// Busca todas as variantes de produto da loja com a quantidade em estoque
// -- e o que alimenta o alerta de estoque baixo. Mesmo limite de seguranca
// de paginacao que fetchOpenOrders.
export async function fetchAllVariants(): Promise<ShopifyVariant[]> {
  const variants: ShopifyVariant[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;
  let safety = 0;

  while (hasNextPage && safety < 20) {
    safety += 1;
    const data = await shopifyGraphQL<ProductsResponse>(PRODUCTS_QUERY, { cursor });
    for (const edge of data.products.edges) {
      for (const variantEdge of edge.node.variants.edges) {
        variants.push({ ...variantEdge.node, productTitle: edge.node.title });
      }
      cursor = edge.cursor;
    }
    hasNextPage = data.products.pageInfo.hasNextPage;
  }

  return variants;
}

interface LocationsResponse {
  locations: { edges: { node: { id: string } }[] };
}

// Loja tem um unico local de estoque; busca o id sempre fresco (evita
// guardar id errado se um dia isso mudar).
export async function fetchPrimaryLocationId(): Promise<string> {
  const data = await shopifyGraphQL<LocationsResponse>(
    `query { locations(first: 1) { edges { node { id } } } }`
  );
  const location = data.locations.edges[0]?.node;
  if (!location) throw new Error("Nenhum local de estoque encontrado na loja.");
  return location.id;
}

interface AdjustQuantitiesResponse {
  inventoryAdjustQuantities: {
    userErrors: { field: string[] | null; message: string }[];
  };
}

// Soma `delta` unidades ao estoque disponivel de uma variante -- usado so
// depois que a usuaria confirma explicitamente que terminou de produzir um
// lote. Nunca roda sozinho.
export async function adjustInventoryQuantity(
  inventoryItemId: string,
  delta: number
): Promise<void> {
  const locationId = await fetchPrimaryLocationId();
  const data = await shopifyGraphQL<AdjustQuantitiesResponse>(
    `mutation AdjustStock($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        userErrors {
          field
          message
        }
      }
    }`,
    {
      input: {
        reason: "restock",
        name: "available",
        referenceDocumentUri: "gid://unica-producao/StockQueueItem/manual",
        changes: [{ inventoryItemId, locationId, delta }],
      },
    }
  );

  const errors = data.inventoryAdjustQuantities.userErrors;
  if (errors.length > 0) {
    throw new Error(`Shopify recusou o ajuste de estoque: ${JSON.stringify(errors)}`);
  }
}

// Apps de personalizacao gravam o texto do cliente em customAttributes,
// mas junto vem lixo tecnico do proprio app (chaves comecando com "_", tipo
// "_has_gpo" ou "_sealsubscription_id") que nao interessa pra producao.
export function personalizationAttributes(
  li: ShopifyLineItem
): { key: string; value: string }[] {
  return li.customAttributes.filter((attr) => !attr.key.startsWith("_"));
}

export function adminOrderUrl(domain: string, shopifyOrderGid: string): string {
  const numericId = shopifyOrderGid.split("/").pop();
  const shopName = domain.replace(".myshopify.com", "");
  return `https://admin.shopify.com/store/${shopName}/orders/${numericId}`;
}
