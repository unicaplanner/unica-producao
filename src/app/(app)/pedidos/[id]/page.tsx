import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/queries";
import { getPriority } from "@/lib/priority";
import { PriorityBadge } from "@/components/PriorityBadge";
import { LineItemCheckbox } from "@/components/LineItemCheckbox";

export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const priority = getPriority(order.prazoLimite);

  return (
    <div className="space-y-6">
      <Link href="/pedidos" className="text-sm text-gray-500 hover:text-gray-800">
        ← Voltar para pedidos
      </Link>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{order.name}</h1>
          </div>
          <PriorityBadge priority={priority} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">Data do pedido</dt>
            <dd className="text-gray-900">{order.orderDate.toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Prazo limite</dt>
            <dd className="text-gray-900">{order.prazoLimite.toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Pagamento</dt>
            <dd className="text-gray-900">{order.financialStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Total</dt>
            <dd className="text-gray-900">
              {Number(order.totalPrice).toLocaleString("pt-BR", {
                style: "currency",
                currency: order.currency,
              })}
            </dd>
          </div>
        </dl>

        <a
          href={order.adminUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Abrir no admin do Shopify →
        </a>
      </div>

      <div className="rounded-lg border bg-white">
        <h2 className="border-b px-4 py-3 font-medium text-gray-900">Itens do pedido</h2>
        <ul className="divide-y">
          {order.lineItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">
                  {item.quantity}× {item.title}
                </p>
                {item.variantTitle && <p className="text-sm text-gray-500">{item.variantTitle}</p>}
                {item.sku && <p className="text-xs text-gray-400">SKU {item.sku}</p>}
              </div>
              <LineItemCheckbox
                lineItemId={item.id}
                produzido={item.statusProducao === "produzido"}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
