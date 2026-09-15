import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/queries";
import { formatCustomAttributes, type CustomAttribute } from "@/lib/productGroups";
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
      <Link href="/pedidos" className="text-sm text-muted hover:text-ink">
        ← Voltar para pedidos
      </Link>

      <div className="rounded-[10px] border border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink">{order.name}</h1>
          </div>
          <PriorityBadge priority={priority} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">Data do pedido</dt>
            <dd className="text-ink">{order.orderDate.toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-muted">Prazo limite</dt>
            <dd className="text-ink">{order.prazoLimite.toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-muted">Pagamento</dt>
            <dd className="text-ink">{order.financialStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Total</dt>
            <dd className="text-ink">
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
          className="mt-4 inline-block text-sm text-vinho hover:underline"
        >
          Abrir no admin do Shopify →
        </a>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border">
        <h2 className="border-b border-border-soft bg-header-bg px-4 py-3 text-[11px] font-bold text-muted">
          Itens do pedido
        </h2>
        <ul className="divide-y divide-border-soft">
          {order.lineItems.map((item) => {
            const texto = formatCustomAttributes(
              (item.customAttributes as CustomAttribute[] | null) ?? []
            );
            return (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">
                    {item.quantity}× {item.title}
                  </p>
                  {item.variantTitle && <p className="text-sm text-muted">{item.variantTitle}</p>}
                  {item.sku && <p className="text-xs text-muted/70">SKU {item.sku}</p>}
                  {texto && (
                    <p className="mt-1 inline-block rounded-full bg-ocre-bg px-2 py-0.5 text-xs font-semibold text-ocre">
                      {texto}
                    </p>
                  )}
                </div>
                <LineItemCheckbox
                  lineItemId={item.id}
                  produzido={item.statusProducao === "produzido"}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
