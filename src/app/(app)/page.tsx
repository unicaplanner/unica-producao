import Link from "next/link";
import { getCustomerNames, getOpenOrders } from "@/lib/queries";
import { formatDiasRestantes, getDiasRestantes, getPriority, PRIORITY_ORDER } from "@/lib/priority";
import { formatCustomAttributes, type CustomAttribute } from "@/lib/productGroups";
import { PainelLista, type ListaSecao } from "@/components/PainelLista";
import { ViewToggle } from "@/components/ViewToggle";
import { PriorityBadge } from "@/components/PriorityBadge";
import { OrderSelectBox, OrderSelectionProvider, SelectAllBox } from "@/components/OrderSelection";
import { KitBadge } from "@/components/KitBadge";
import { isKitOnlyOrder, kitsFirst } from "@/lib/kits";
import { UnicaBoxBadge } from "@/components/UnicaBoxBadge";
import { isUnicaBoxOrder } from "@/lib/unicaBox";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista: vistaParam } = await searchParams;
  const vista = vistaParam === "lista" ? "lista" : "cartoes";
  const orders = await getOpenOrders();
  const nomes = await getCustomerNames(orders.map((o) => o.customerId));
  const now = new Date();

  const buckets = new Map(PRIORITY_ORDER.map((p) => [p, [] as typeof orders]));
  // Unica Box (assinatura paga antecipada, prazo especial) fica fora da conta de atraso.
  const unicaBox = orders.filter((o) => isUnicaBoxOrder(o.lineItems));
  for (const order of orders) {
    if (isUnicaBoxOrder(order.lineItems)) continue;
    buckets.get(getPriority(order.prazoLimite, now))!.push(order);
  }

  const totalItensPendentes = orders.reduce(
    (sum, o) => sum + o.lineItems.filter((li) => li.statusProducao === "pendente").length,
    0
  );

  // Mesmas seções do painel (Atrasado, Sai hoje... e Unica Box no fim), no
  // formato que a visão em lista precisa (dados simples, itens de cada pedido).
  const secoesLista: ListaSecao[] = [...PRIORITY_ORDER, "unica_box" as const]
    .map((priority) => ({
      key: priority,
      priority: priority === "unica_box" ? null : priority,
      lista: priority === "unica_box" ? unicaBox : kitsFirst(buckets.get(priority)!),
    }))
    .filter((s) => s.lista.length > 0)
    .map((s) => ({
      key: s.key,
      priority: s.priority,
      pedidos: s.lista.map((order) => {
        const unica = isUnicaBoxOrder(order.lineItems);
        return {
          id: order.id,
          name: order.name,
          clienteNome: (order.customerId && nomes[order.customerId]) || null,
          prazo: unica ? null : order.prazoLimite.toLocaleDateString("pt-BR"),
          diasLabel: unica ? null : formatDiasRestantes(getDiasRestantes(order.prazoLimite, now)),
          priority: unica ? null : getPriority(order.prazoLimite, now),
          isKit: isKitOnlyOrder(order.lineItems),
          isUnicaBox: unica,
          items: order.lineItems.map((li) => ({
            id: li.id,
            title: li.title,
            variantTitle: li.variantTitle,
            quantity: li.quantity,
            texto: formatCustomAttributes((li.customAttributes as CustomAttribute[] | null) ?? []),
            produzido: li.statusProducao === "produzido",
          })),
        };
      }),
    }));

  if (orders.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
        Nenhum pedido em aberto. Clique em &quot;Sincronizar agora&quot; se acabou de configurar
        o app.
      </div>
    );
  }

  return (
    <OrderSelectionProvider>
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

      {vista === "lista" ? (
        <PainelLista
          leading={<ViewToggle vista="lista" />}
          secoes={secoesLista}
        />
      ) : (
        <ViewToggle vista="cartoes" />
      )}

      {vista === "cartoes" && [...PRIORITY_ORDER, "unica_box" as const].map((priority) => {
        const list = priority === "unica_box" ? unicaBox : kitsFirst(buckets.get(priority)!);
        if (list.length === 0) return null;
        return (
          <section key={priority}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              {priority === "unica_box" ? <UnicaBoxBadge /> : <PriorityBadge priority={priority} />}
              <span className="font-normal text-muted">({list.length})</span>
              <span className="ml-auto">
                <SelectAllBox ids={list.map((o) => o.id)} label="Selecionar todos" />
              </span>
            </h2>
            <div className="overflow-hidden rounded-[10px] border border-border">
              <ul className="divide-y divide-border-soft">
                {list.map((order) => {
                  const pendentes = order.lineItems.filter(
                    (li) => li.statusProducao === "pendente"
                  ).length;
                  return (
                    <li key={order.id} className="flex items-center hover:bg-header-bg">
                      <span className="pl-4">
                        <OrderSelectBox id={order.id} label={order.name} />
                      </span>
                      <Link
                        href={`/pedidos/${order.id}`}
                        className="flex flex-1 items-center justify-between gap-4 px-4 py-3"
                      >
                        <div>
                          <p className="flex items-center gap-2 font-semibold text-ink">
                            {order.name}
                            {isKitOnlyOrder(order.lineItems) && <KitBadge />}
                            {isUnicaBoxOrder(order.lineItems) && <UnicaBoxBadge />}
                          </p>
                          <p className="text-sm text-muted">
                            Pedido em {order.orderDate.toLocaleDateString("pt-BR")}
                            {isUnicaBoxOrder(order.lineItems)
                              ? " · prazo especial (assinatura)"
                              : ` · prazo ${order.prazoLimite.toLocaleDateString("pt-BR")}`}
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
    </OrderSelectionProvider>
  );
}
