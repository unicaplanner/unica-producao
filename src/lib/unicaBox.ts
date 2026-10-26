// Pedido de Unica Box = assinatura paga antecipadamente, com prazo
// especial: nao entra na conta de atraso (nem no 15 dias uteis dos demais
// pedidos). Reconhecido pelo titulo do produto no Shopify ("Unica Box",
// "Unica Box - Trimestre 01"...): qualquer item assim marca o pedido todo.
function norm(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function isUnicaBoxOrder(lineItems: { title: string }[]): boolean {
  return lineItems.some((li) => norm(li.title).includes("unica box"));
}

// Leva os pedidos Unica Box pro fim, mantendo a ordem dos demais.
export function unicaBoxLast<T extends { lineItems: { title: string }[] }>(orders: T[]): T[] {
  return [
    ...orders.filter((o) => !isUnicaBoxOrder(o.lineItems)),
    ...orders.filter((o) => isUnicaBoxOrder(o.lineItems)),
  ];
}
