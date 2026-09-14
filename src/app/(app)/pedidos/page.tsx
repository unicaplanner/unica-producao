import Link from "next/link";
import { getOpenOrders } from "@/lib/queries";
import {
  formatDiasRestantes,
  getDiasRestantes,
  getPriority,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  PRIORITY_TONE,
  type Priority,
} from "@/lib/priority";
import { PriorityBadge } from "@/components/PriorityBadge";

export const dynamic = "force-dynamic";

const DIAS_TONE_TEXT = {
  vinho: "text-vinho",
  ocre: "text-ocre",
  oliva: "text-oliva",
};

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
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            !filtro ? "bg-vinho text-white" : "bg-border-soft text-ink/70 hover:bg-border"
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                filtro === p ? "bg-vinho text-white" : "bg-border-soft text-ink/70 hover:bg-border"
              }`}
            >
              {PRIORITY_LABEL[p]} ({count})
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-header-bg">
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-muted">Pedido</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-muted">Itens</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-muted">Prazo</th>
              <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3.5 py-6 text-center text-muted">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
            {filtrados.map(({ order, priority }) => {
              const pendentes = order.lineItems.filter((li) => li.statusProducao === "pendente").length;
              const dias = getDiasRestantes(order.prazoLimite, now);
              return (
                <tr key={order.id} className="border-t border-border-soft hover:bg-header-bg">
                  <td className="px-3.5 py-3">
                    <Link href={`/pedidos/${order.id}`} className="font-semibold text-ink hover:underline">
                      {order.name}
                    </Link>
                  </td>
                  <td className="px-3.5 py-3 text-muted">
                    {order.lineItems.length} item{order.lineItems.length === 1 ? "" : "s"} (
                    {pendentes} pendente{pendentes === 1 ? "" : "s"})
                  </td>
                  <td className={`px-3.5 py-3 font-semibold ${DIAS_TONE_TEXT[PRIORITY_TONE[priority]]}`}>
                    {formatDiasRestantes(dias)}
                  </td>
                  <td className="px-3.5 py-3">
                    <PriorityBadge priority={priority} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
