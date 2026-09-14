import Link from "next/link";
import { getOpenOrders } from "@/lib/queries";
import { getPriority, PRIORITY_ORDER } from "@/lib/priority";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatCard } from "@/components/StatCard";

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
      <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
        Nenhum pedido em aberto. Clique em &quot;Sincronizar agora&quot; se acabou de configurar
        o app.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <StatCard label="PEDIDOS ABERTOS" value={orders.length} />
          <StatCard label="ITENS PENDENTES" value={totalItensPendentes} />
          <StatCard label="ATRASADO" value={buckets.get("atrasado")!.length} tone="vinho" />
          <StatCard label="SAI HOJE" value={buckets.get("sai_hoje")!.length} tone="ocre" />
        </div>
        <p className="mt-2.5 text-[11.5px] text-muted">
          Prioridade calculada em dias úteis a partir do prazo de 10–15 dias úteis desde o
          pedido.
        </p>
      </div>

      {PRIORITY_ORDER.map((priority) => {
        const list = buckets.get(priority)!;
        if (list.length === 0) return null;
        return (
          <section key={priority}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <PriorityBadge priority={priority} />
              <span className="font-normal text-muted">({list.length})</span>
            </h2>
            <div className="overflow-hidden rounded-[10px] border border-border">
              <ul className="divide-y divide-border-soft">
                {list.map((order) => {
                  const pendentes = order.lineItems.filter(
                    (li) => li.statusProducao === "pendente"
                  ).length;
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/pedidos/${order.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-header-bg"
                      >
                        <div>
                          <p className="font-semibold text-ink">{order.name}</p>
                          <p className="text-sm text-muted">
                            Pedido em {order.orderDate.toLocaleDateString("pt-BR")} · prazo{" "}
                            {order.prazoLimite.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-sm text-muted">
                          {pendentes} pendente{pendentes === 1 ? "" : "s"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
