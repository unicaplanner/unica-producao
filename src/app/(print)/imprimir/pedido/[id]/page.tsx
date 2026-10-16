import { notFound } from "next/navigation";
import { getCustomerNames, getOrderById } from "@/lib/queries";
import { FichaPedido } from "@/components/FichaPedido";
import { PrintToolbar } from "@/components/PrintToolbar";

export const dynamic = "force-dynamic";

// Ficha de um pedido em A5 (ver FichaPedido).
export default async function ImprimirPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const nomes = await getCustomerNames([order.customerId]);
  const clienteNome = (order.customerId && nomes[order.customerId]) || null;

  return (
    <>
      <PrintToolbar voltarHref={`/pedidos/${order.id}`} titulo={`Ficha ${order.name}`} />
      <main className="mx-auto my-4 max-w-[148mm] bg-white p-[8mm] text-[10pt] leading-snug shadow-[0_2px_10px_rgba(0,0,0,0.15)] print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <FichaPedido order={order} clienteNome={clienteNome} />
      </main>
    </>
  );
}
