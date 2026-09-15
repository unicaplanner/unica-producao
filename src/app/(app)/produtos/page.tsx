import { getPendingGroupedByProduct } from "@/lib/queries";
import { ProdutosList } from "@/components/ProdutosList";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const grupos = await getPendingGroupedByProduct();

  if (grupos.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
        Nenhum item pendente de produção no momento. 🎉
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11.5px] text-muted">
        Itens pendentes de todos os pedidos abertos, agrupados por produto — para produzir em
        lote.
      </p>
      <ProdutosList grupos={grupos} />
    </div>
  );
}
