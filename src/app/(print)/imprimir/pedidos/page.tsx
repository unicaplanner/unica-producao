import { getCustomerNames, getOrdersByIds } from "@/lib/queries";
import { FichaPedido } from "@/components/FichaPedido";
import { PrintToolbar } from "@/components/PrintToolbar";

export const dynamic = "force-dynamic";

// Varias fichas A5 de uma vez (pedidos escolhidos na lista): cada pedido
// comeca numa folha nova. ?ids=a,b,c na ordem em que foram marcados.
export default async function ImprimirPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const lista = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  const orders = await getOrdersByIds(lista);
  const nomes = await getCustomerNames(orders.map((o) => o.customerId));

  return (
    <>
      <PrintToolbar
        voltarHref="/pedidos"
        titulo={`${orders.length} ficha${orders.length === 1 ? "" : "s"}`}
      />
      {orders.length === 0 && (
        <p className="no-print p-8 text-center text-sm text-muted">Nenhum pedido selecionado.</p>
      )}
      {orders.map((order) => (
        <main
          key={order.id}
          className="mx-auto my-4 max-w-[148mm] bg-white p-[8mm] text-[10pt] leading-snug shadow-[0_2px_10px_rgba(0,0,0,0.15)] print:my-0 print:max-w-none print:break-after-page print:p-0 print:shadow-none print:last:break-after-auto"
        >
          <FichaPedido
            order={order}
            clienteNome={(order.customerId && nomes[order.customerId]) || null}
          />
        </main>
      ))}
    </>
  );
}
