"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCustomAttributes, type ProductGroup } from "@/lib/productGroups";
import { LineItemCheckbox } from "@/components/LineItemCheckbox";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function titleMatches(grupo: ProductGroup, termo: string): boolean {
  if (normalize(grupo.title).includes(termo)) return true;
  return Boolean(grupo.variantTitle && normalize(grupo.variantTitle).includes(termo));
}

function pedidoMatches(p: ProductGroup["pedidos"][number], termo: string): boolean {
  if (normalize(p.orderName).includes(termo)) return true;
  return p.customAttributes.some(
    (a) => normalize(a.key).includes(termo) || normalize(a.value).includes(termo)
  );
}

// Se o termo bate no nome do produto, mostra o grupo inteiro (todos os
// pedidos). Se so bate em pedidos/textos especificos dentro do grupo,
// mostra so essas linhas -- assim buscar "Fé" acha so a unidade certa
// dentro de "Aba Divisória Personalizada", nao as 3.
function filterGroup(grupo: ProductGroup, termo: string): ProductGroup | null {
  if (titleMatches(grupo, termo)) return grupo;
  const pedidos = grupo.pedidos.filter((p) => pedidoMatches(p, termo));
  if (pedidos.length === 0) return null;
  const quantidadePendente = pedidos.reduce((sum, p) => sum + p.quantity, 0);
  return { ...grupo, pedidos, quantidadePendente };
}

export function ProdutosList({ grupos }: { grupos: ProductGroup[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = normalize(busca.trim());
    if (!termo) return grupos;
    return grupos
      .map((g) => filterGroup(g, termo))
      .filter((g): g is ProductGroup => g !== null);
  }, [grupos, busca]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por produto, pedido ou texto personalizado..."
        className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-vinho focus:outline-none"
      />

      {filtrados.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
          Nenhum item encontrado para &quot;{busca}&quot;.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((grupo) => (
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
                {grupo.pedidos.map((p) => {
                  const texto = formatCustomAttributes(p.customAttributes);
                  return (
                    <li
                      key={p.lineItemId}
                      className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
                    >
                      <Link href={`/pedidos/${p.orderId}`} className="text-ink hover:underline">
                        {p.orderName} · {p.quantity}× · prazo{" "}
                        {p.prazoLimite.toLocaleDateString("pt-BR")}
                        {texto && (
                          <span className="ml-2 rounded-full bg-ocre-bg px-2 py-0.5 text-xs font-semibold text-ocre">
                            {texto}
                          </span>
                        )}
                      </Link>
                      <LineItemCheckbox lineItemId={p.lineItemId} produzido={false} />
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
