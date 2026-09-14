import Link from "next/link";
import { getOpenOrders } from "@/lib/queries";
import { getPriority, PRIORITY_LABEL, PRIORITY_ORDER, type Priority } from "@/lib/priority";
import { PriorityBadge } from "@/components/PriorityBadge";

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ prioridade?: string }>;
}) {
  const { prioridade } = await searchParams;
  const filtro = PRIORITY_ORDER.includes(prioridade as Priority) ? (prioridade as Priority) : null;

  const orders = await getOpenOrders();
  const now = new Date();
  const comPrioridade = orders.map((order) => ({ order, priority: getPriority(order.prazoLimite, now) }));
  const filtrados = filtro ? comPrioridade.filter((o) => o.priority === filtro) : comPrioridade;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/pedidos"
          className={`rounded-full px-3 py-1 text-sm ${
            !filtro ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Todos ({orders.length})
        </Link>
        {PRIORITY_ORDER.map((p) => {
          const count = comPrioridade.filter((o) => o.priority === p).length;
          return (
            <Link
              key={p}
              href={`/pedidos?prioridade=${p}`}
              className={`rounded-full px-3 py-1 text-sm ${
                filtro === p ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {PRIORITY_LABEL[p]} ({count})
            </Link>
          );
        })}
      </div>

      <ul className="divide-y rounded-lg border bg-white">
        {filtrados.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">Nenhum pedido encontrado.</li>
        )}
        {filtrados.map(({ order, priority }) => {
          const pendentes = order.lineItems.filter((li) => li.statusProducao === "pendente").length;
          return (
            <li key={order.id}>
              <Link
                href={`/pedidos/${order.id}`}
                className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {order.name}{" "}
                    <span className="font-normal text-gray-500">
                      {order.customerName ?? "cliente sem nome"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Pedido em {order.orderDate.toLocaleDateString("pt-BR")} · prazo{" "}
                    {order.prazoLimite.toLocaleDateString("pt-BR")} · {order.lineItems.length} ite
                    {order.lineItems.length === 1 ? "m" : "ns"} ({pendentes} pendente
                    {pendentes === 1 ? "" : "s"})
                  </p>
                </div>
                <PriorityBadge priority={priority} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
