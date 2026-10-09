import { getAutoSiteUrls, getPendingGroupedByProduct, getProductInfo } from "@/lib/queries";
import { ProdutosList } from "@/components/ProdutosList";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const [grupos, info, autoSiteUrls] = await Promise.all([
    getPendingGroupedByProduct(),
    getProductInfo(),
    getAutoSiteUrls(),
  ]);

  if (grupos.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
        Nenhum item pendente de produção no momento. 🎉
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11.5px] text-muted">
          Itens pendentes de todos os pedidos abertos, agrupados por produto — para produzir em
          lote.
        </p>
        <a
          href="/imprimir/producao"
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-border-soft px-3 py-1 text-xs font-semibold text-ink hover:bg-border"
        >
          Imprimir lista A5
        </a>
      </div>
      <ProdutosList grupos={grupos} info={info} autoSiteUrls={autoSiteUrls} />
    </div>
  );
}
