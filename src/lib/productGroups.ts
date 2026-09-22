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
