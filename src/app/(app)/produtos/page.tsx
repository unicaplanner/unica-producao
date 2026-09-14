import Link from "next/link";
import { getPendingGroupedByProduct } from "@/lib/queries";
import { LineItemCheckbox } from "@/components/LineItemCheckbox";

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
      <div className="space-y-3">
        {grupos.map((grupo) => (
          <details key={grupo.key} className="rounded-[10px] bg-header-bg" open>
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-[12px] font-bold text-muted">
                  {grupo.title}
                  {grupo.variantTitle && (
                    <span className="font-normal"> · {grupo.variantTitle}</span>
                  )}
                </p>
              </div>
              <span className="whitespace-nowrap rounded-full bg-vinho px-3 py-1 text-xs font-semibold text-white">
                {grupo.quantidadePendente} pendente{grupo.quantidadePendente === 1 ? "" : "s"}
              </span>
            </summary>
            <ul className="border-t border-border">
              {grupo.pedidos.map((p) => (
                <li
                  key={p.lineItemId}
                  className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
                >
                  <Link href={`/pedidos/${p.orderId}`} className="text-ink hover:underline">
                    {p.orderName} · {p.quantity}× · prazo {p.prazoLimite.toLocaleDateString("pt-BR")}
                  </Link>
                  <LineItemCheckbox lineItemId={p.lineItemId} produzido={false} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
