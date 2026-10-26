import { formatCustomAttributes, type CustomAttribute } from "@/lib/productGroups";
import { getPriority, PRIORITY_LABEL } from "@/lib/priority";
import { isUnicaBoxOrder } from "@/lib/unicaBox";
import { PrintCheckbox } from "@/components/PrintCheckbox";
import type { getOrderById } from "@/lib/queries";

type OrderComCaixa = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

// Ficha do pedido em A5, pra acompanhar a caixa: itens com quadradinho
// (ja marcado o que ja foi produzido) e o checklist de embalagem. Usada
// tanto na ficha de um pedido so quanto na impressao de varios de uma vez.
export function FichaPedido({
  order,
  clienteNome,
}: {
  order: OrderComCaixa;
  clienteNome: string | null;
}) {
  const unicaBox = isUnicaBoxOrder(order.lineItems);
  const priority = getPriority(order.prazoLimite);
  const box = order.box;
  const outrosNaCaixa = box?.orders.filter((o) => o.id !== order.id) ?? [];

  return (
    <>
      <header className="mb-3 border-b-[0.4mm] border-black pb-2">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[18pt] font-bold">Pedido {order.name}</h1>
          <b className="text-[9pt] uppercase">{unicaBox ? "Unica Box" : PRIORITY_LABEL[priority]}</b>
        </div>
        {clienteNome && <p className="text-[12pt] font-bold">{clienteNome}</p>}
        <p className="text-[9pt]">
          Pedido em {order.orderDate.toLocaleDateString("pt-BR")} ·{" "}
          {unicaBox ? (
            <b>assinatura — prazo especial</b>
          ) : (
            <b>prazo {order.prazoLimite.toLocaleDateString("pt-BR")}</b>
          )}
        </p>
        <p className="text-[9pt]">
          Frete: {order.shippingMethod ?? "—"} · Pagamento: {order.financialStatus ?? "—"}
        </p>
      </header>

      <section className="mb-4">
        <h2 className="mb-1 text-[10pt] font-bold uppercase tracking-wide">Itens</h2>
        <ul>
          {order.lineItems.map((item) => {
            const texto = formatCustomAttributes(
              (item.customAttributes as CustomAttribute[] | null) ?? []
            );
            return (
              <li key={item.id} className="flex items-start py-[1.2mm] break-inside-avoid">
                <PrintCheckbox checked={item.statusProducao === "produzido"} />
                <span>
                  <b>
                    {item.quantity}× {item.title}
                  </b>
                  {item.variantTitle && <> · {item.variantTitle}</>}
                  {item.sku && <span className="text-[8pt]"> (SKU {item.sku})</span>}
                  {texto && (
                    <span className="mt-0.5 block border-[0.2mm] border-black px-1.5 py-0.5 text-[9pt] italic">
                      {texto}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="break-inside-avoid">
        <h2 className="mb-1 text-[10pt] font-bold uppercase tracking-wide">
          Embalagem{box ? ` — Caixa ${box.numero}` : ""}
        </h2>
        {outrosNaCaixa.length > 0 && (
          <p className="mb-1 text-[9pt]">
            Vai junto com: <b>{outrosNaCaixa.map((o) => o.name).join(", ")}</b>
          </p>
        )}
        <ul>
          <li className="py-[1.2mm]">
            <PrintCheckbox checked={box?.montada} />
            Caixa montada
          </li>
          <li className="py-[1.2mm]">
            <PrintCheckbox checked={box?.finalizada} />
            Caixa finalizada (todos os itens dentro)
          </li>
          <li className="py-[1.2mm]">
            <PrintCheckbox checked={box?.notaFiscalGerada} />
            Nota fiscal gerada
          </li>
          <li className="py-[1.2mm]">
            <PrintCheckbox checked={box?.etiquetaGerada} />
            Etiqueta de envio gerada
          </li>
          <li className="py-[1.2mm]">
            <PrintCheckbox checked={box?.despachado} />
            Despachado / coletado
          </li>
        </ul>
      </section>
    </>
  );
}
