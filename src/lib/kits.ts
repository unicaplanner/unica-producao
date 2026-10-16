// Kits prontos que saem na frente: pedido que tem SO esses produtos
// (nenhum outro item) vai pro topo das listas, com selo "Kit prioritário".
// Titulos como estao no Shopify (os 4 links do site: planner-2027-essencial-
// vertical, kit-planner-2027-gift-case-miolos, 2027-planner-iniciante,
// kit-refil-planner-2027). Se um desses produtos for renomeado no Shopify,
// atualizar o titulo aqui.
const KIT_PRIORITY_TITLES = [
  "Planner 2027 Essencial Vertical",
  "Kit Planner 2027 GIFT",
  "2027 - Planner Iniciante",
  "Kit Refil Planner 2027",
];

function norm(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

const KIT_SET = new Set(KIT_PRIORITY_TITLES.map(norm));

export function isKitOnlyOrder(lineItems: { title: string }[]): boolean {
  return lineItems.length > 0 && lineItems.every((li) => KIT_SET.has(norm(li.title)));
}

// Leva os pedidos so-de-kit pro topo, mantendo a ordem original (prazo)
// dentro de cada grupo.
export function kitsFirst<T extends { lineItems: { title: string }[] }>(orders: T[]): T[] {
  const kits = orders.filter((o) => isKitOnlyOrder(o.lineItems));
  const resto = orders.filter((o) => !isKitOnlyOrder(o.lineItems));
  return [...kits, ...resto];
}
