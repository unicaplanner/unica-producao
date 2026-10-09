import { getPendingGroupedByProduct } from "@/lib/queries";
import { filterGroupsByOrderDate, formatCustomAttributes } from "@/lib/productGroups";
import { getPriority } from "@/lib/priority";
import { PrintToolbar } from "@/components/PrintToolbar";
import { PrintCheckbox } from "@/components/PrintCheckbox";

export const dynamic = "force-dynamic";

// Lista de producao em lote, em A5: um bloco por produto, uma linha com
// quadradinho por pedido. Mesmos dados da tela "Agrupado por item".
export default async function ImprimirProducaoPage({
  searchParams,
}: {
  searchParams: Promise<{ ate?: string }>;
}) {
  const { ate } = await searchParams;
  const todos = await getPendingGroupedByProduct();
  const grupos = ate ? filterGroupsByOrderDate(todos, ate) : todos;
  const ateFormatado = ate && grupos !== todos ? ate.split("-").reverse().join("/") : null;
  const hoje = new Date();
  const totalItens = grupos.reduce((s, g) => s + g.quantidadePendente, 0);

  return (
    <>
      <PrintToolbar voltarHref="/produtos" titulo="Lista de produção" />
      <main className="mx-auto my-4 max-w-[148mm] bg-white p-[8mm] text-[9pt] leading-tight shadow-[0_2px_10px_rgba(0,0,0,0.15)] print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="mb-3 border-b-[0.4mm] border-black pb-2">
          <h1 className="text-[14pt] font-bold">Lista de produção</h1>
          <p className="text-[8.5pt]">
            {hoje.toLocaleDateString("pt-BR")} · {totalItens} unidades pendentes em{" "}
            {grupos.length} produtos
            {ateFormatado && <> · pedidos feitos até {ateFormatado}, do mais urgente ao menos</>}
          </p>
        </header>

        {grupos.length === 0 && <p>Nenhum item pendente de produção. 🎉</p>}

        {grupos.map((g) => (
          <section key={g.key} className="mb-2">
            <h2 className="flex items-baseline justify-between gap-2 border-b-[0.2mm] border-black pb-0.5 text-[10pt] font-bold break-after-avoid">
              <span>
                {g.title}
                {g.variantTitle && <span className="font-normal"> · {g.variantTitle}</span>}
              </span>
              <span className="shrink-0 text-[9pt]">{g.quantidadePendente} pend.</span>
            </h2>
            <ul>
              {g.pedidos.map((p) => {
                const texto = formatCustomAttributes(p.customAttributes);
                const atrasado = getPriority(p.prazoLimite, hoje) === "atrasado";
                return (
                  <li key={p.lineItemId} className="flex items-start py-[0.6mm] break-inside-avoid">
                    <PrintCheckbox />
                    <span>
                      <b>{p.orderName}</b>
                      {p.clienteNome && <> · {p.clienteNome}</>} · {p.quantity}× · prazo{" "}
                      {p.prazoLimite.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                      {atrasado && <b> · ATRASADO</b>}
                      {texto && <span className="italic"> — {texto}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
