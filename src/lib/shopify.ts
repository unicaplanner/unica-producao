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
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  cancelledAt: string | null;
  closedAt: string | null;
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

export function adminOrderUrl(domain: string, shopifyOrderGid: string): string {
  const numericId = shopifyOrderGid.split("/").pop();
  const shopName = domain.replace(".myshopify.com", "");
  return `https://admin.shopify.com/store/${shopName}/orders/${numericId}`;
}
