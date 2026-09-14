import Link from "next/link";
import { getOpenOrders } from "@/lib/queries";
import { getPriority, PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/priority";
import { PriorityBadge } from "@/components/PriorityBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const orders = await getOpenOrders();
  const now = new Date();

  const buckets = new Map(PRIORITY_ORDER.map((p) => [p, [] as typeof orders]));
  for (const order of orders) {
    buckets.get(getPriority(order.prazoLimite, now))!.push(order);
  }

  const totalItensPendentes = orders.reduce(
    (sum, o) => sum + o.lineItems.filter((li) => li.statusProducao === "pendente").length,
    0
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
        Nenhum pedido em aberto. Clique em &quot;Sincronizar agora&quot; se acabou de configurar
        o app.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
          <p className="text-sm text-gray-500">pedidos abertos</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-2xl font-semibold text-gray-900">{totalItensPendentes}</p>
          <p className="text-sm text-gray-500">itens pendentes</p>
        </div>
        {(["atrasado", "sai_hoje"] as const).map((p) => (
          <div key={p} className="rounded-lg border bg-white p-4">
            <p className="text-2xl font-semibold text-gray-900">{buckets.get(p)!.length}</p>
            <p className="text-sm text-gray-500">{PRIORITY_LABEL[p].toLowerCase()}</p>
          </div>
        ))}
      </div>

      {PRIORITY_ORDER.map((priority) => {
        const list = buckets.get(priority)!;
        if (list.length === 0) return null;
        return (
          <section key={priority}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <PriorityBadge priority={priority} />
              <span className="text-gray-500 font-normal">({list.length})</span>
            </h2>
            <ul className="divide-y rounded-lg border bg-white">
              {list.map((order) => {
                const pendentes = order.lineItems.filter(
                  (li) => li.statusProducao === "pendente"
                ).length;
                return (
                  <li key={order.id}>
                    <Link
                      href={`/pedidos/${order.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{order.name}</p>
                        <p className="text-sm text-gray-500">
                          Pedido em {order.orderDate.toLocaleDateString("pt-BR")} · prazo{" "}
                          {order.prazoLimite.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-sm text-gray-600">
                        {pendentes} pendente{pendentes === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
