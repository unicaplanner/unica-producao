// Tipos e helpers puros (sem import de Prisma) pra poderem ser usados tanto
// em Server Components quanto em Client Components -- importar de
// lib/queries.ts num componente client puxaria o driver do Postgres pro
// bundle do navegador.

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
    orderDate: Date;
    clienteNome: string | null;
    prazoLimite: Date;
    quantity: number;
    customAttributes: CustomAttribute[];
  }[];
}

// Informacoes cadastradas a mao pra um grupo (produto+variante).
export interface ProductInfoData {
  printUrl: string | null;
  siteUrl: string | null;
  specs: string | null;
}

// Formata os atributos de personalizacao pra exibicao curta, ex:
// "text-1: Fé" ou "Cor: Azul, Nome: Ana" quando tem mais de um.
export function formatCustomAttributes(attrs: CustomAttribute[]): string | null {
  if (attrs.length === 0) return null;
  return attrs.map((a) => `${a.key}: ${a.value}`).join(", ");
}

// Filtro "pedidos feitos ate DD/MM": data no formato YYYY-MM-DD (input date),
// inclusive o dia inteiro, no horario de Brasilia.
export function endOfDayBrasilia(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const d = new Date(`${isoDate}T23:59:59.999-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Mantem so os itens de pedidos feitos ate a data (inclusive), recalcula a
// quantidade de cada produto e reordena os produtos por quantidade. Dentro
// de cada produto a ordem de prioridade (prazo mais proximo primeiro) e mantida.
export function filterGroupsByOrderDate(grupos: ProductGroup[], isoDate: string): ProductGroup[] {
  const limite = endOfDayBrasilia(isoDate);
  if (!limite) return grupos;
  return grupos
    .map((g) => {
      const pedidos = g.pedidos.filter((p) => new Date(p.orderDate) <= limite);
      return { ...g, pedidos, quantidadePendente: pedidos.reduce((s, p) => s + p.quantity, 0) };
    })
    .filter((g) => g.pedidos.length > 0)
    .sort((a, b) => b.quantidadePendente - a.quantidadePendente);
}
