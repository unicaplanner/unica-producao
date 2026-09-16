import { getAllVariantsBasic, getLowStockVariants, getStockQueue } from "@/lib/queries";
import { EstoquePanel } from "@/components/EstoquePanel";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const [lowStock, queue, variantesBasic] = await Promise.all([
    getLowStockVariants(),
    getStockQueue(),
    getAllVariantsBasic(),
  ]);

  if (variantesBasic.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
        Nenhum produto sincronizado ainda. Clique em &quot;Sincronizar agora&quot;.
      </div>
    );
  }

  return (
    <EstoquePanel
      lowStock={lowStock}
      queue={queue.map((q) => ({
        ...q,
        sincronizadoEm: q.sincronizadoEm?.toISOString() ?? null,
      }))}
      variantesBasic={variantesBasic}
    />
  );
}
