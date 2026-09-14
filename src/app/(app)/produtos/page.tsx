import Link from "next/link";
import { getPendingGroupedByProduct } from "@/lib/queries";
import { LineItemCheckbox } from "@/components/LineItemCheckbox";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const grupos = await getPendingGroupedByProduct();

  if (grupos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
        Nenhum item pendente de produção no momento. 🎉
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Itens pendentes de todos os pedidos abertos, agrupados por produto — para produzir em
        lote.
      </p>
      <div className="space-y-3">
        {grupos.map((grupo) => (
          <details key={grupo.key} className="rounded-lg border bg-white open:shadow-sm" open>
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{grupo.title}</p>
                {grupo.variantTitle && (
                  <p className="text-sm text-gray-500">{grupo.variantTitle}</p>
                )}
              </div>
              <span className="whitespace-nowrap rounded-full bg-gray-900 px-3 py-1 text-sm font-medium text-white">
                {grupo.quantidadePendente} pendente{grupo.quantidadePendente === 1 ? "" : "s"}
              </span>
            </summary>
            <ul className="divide-y border-t">
              {grupo.pedidos.map((p) => (
                <li key={p.lineItemId} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <Link href={`/pedidos/${p.orderId}`} className="text-sm text-gray-700 hover:underline">
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
