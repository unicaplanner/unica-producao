"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { KitBadge } from "@/components/KitBadge";
import { UnicaBoxBadge } from "@/components/UnicaBoxBadge";
import { OrderSelectBox, SelectAllBox } from "@/components/OrderSelection";
import type { Priority } from "@/lib/priority";

export interface ListaItem {
  id: string;
  title: string;
  variantTitle: string | null;
  quantity: number;
  texto: string | null;
  produzido: boolean;
}

export interface ListaPedido {
  id: string;
  name: string;
  clienteNome: string | null;
  prazo: string | null; // dd/mm/aaaa; nulo = prazo especial (Unica Box)
  diasLabel: string | null; // "+2d úteis", "hoje"...
  priority: Priority | null; // nulo = Unica Box
  isKit: boolean;
  isUnicaBox: boolean;
  items: ListaItem[];
}

export interface ListaSecao {
  key: string;
  priority: Priority | null; // nulo = seção Unica Box
  pedidos: ListaPedido[];
}

// Visão em lista do Painel: uma linha por pedido (número, cliente, progresso,
// prazo, status); clicar na linha abre os itens, cada um com o quadradinho
// "Produzido". O que é marcado aqui grava igual ao botão da tela do pedido.
export function PainelLista({ secoes, leading }: { secoes: ListaSecao[]; leading: ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [feitos, setFeitos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      secoes.flatMap((s) => s.pedidos.flatMap((p) => p.items.map((i) => [i.id, i.produzido])))
    )
  );

  const todosIds = secoes.flatMap((s) => s.pedidos.map((p) => p.id));

  function alternar(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function marcar(itemId: string, produzido: boolean) {
    setFeitos((f) => ({ ...f, [itemId]: produzido }));
    const res = await fetch(`/api/line-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produzido }),
    });
    if (!res.ok) {
      setFeitos((f) => ({ ...f, [itemId]: !produzido }));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {leading}
        <div className="flex gap-2">
          <button
            onClick={() => setAbertos(new Set(todosIds))}
            className="rounded-full bg-border-soft px-3 py-1 text-xs font-semibold text-ink hover:bg-border"
          >
            Expandir todos
          </button>
          <button
            onClick={() => setAbertos(new Set())}
            className="rounded-full bg-border-soft px-3 py-1 text-xs font-semibold text-ink hover:bg-border"
          >
            Recolher todos
          </button>
        </div>
      </div>

      {secoes.map((secao) => (
        <section key={secao.key}>
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            {secao.priority ? <PriorityBadge priority={secao.priority} /> : <UnicaBoxBadge />}
            <span className="font-normal text-muted">({secao.pedidos.length})</span>
            <span className="ml-auto">
              <SelectAllBox ids={secao.pedidos.map((p) => p.id)} label="Selecionar todos" />
            </span>
          </h2>
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-header-bg">
                  <th className="w-16 py-2.5 pl-3.5" />
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted">Pedido</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted">Cliente</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted">Itens</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-muted">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {secao.pedidos.map((pedido) => {
                  const aberto = abertos.has(pedido.id);
                  const total = pedido.items.length;
                  const prontos = pedido.items.filter((i) => feitos[i.id]).length;
                  return (
                    <PedidoLinhas
                      key={pedido.id}
                      pedido={pedido}
                      aberto={aberto}
                      total={total}
                      prontos={prontos}
                      feitos={feitos}
                      onAlternar={() => alternar(pedido.id)}
                      onMarcar={marcar}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function PedidoLinhas({
  pedido,
  aberto,
  total,
  prontos,
  feitos,
  onAlternar,
  onMarcar,
}: {
  pedido: ListaPedido;
  aberto: boolean;
  total: number;
  prontos: number;
  feitos: Record<string, boolean>;
  onAlternar: () => void;
  onMarcar: (itemId: string, produzido: boolean) => void;
}) {
  const completo = total > 0 && prontos === total;
  return (
    <>
      <tr
        onClick={onAlternar}
        className="cursor-pointer border-t border-border-soft hover:bg-header-bg"
      >
        <td className="py-3 pl-3.5">
          <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
            <OrderSelectBox id={pedido.id} label={pedido.name} />
            <button
              onClick={onAlternar}
              aria-label={aberto ? "Recolher itens" : "Expandir itens"}
              aria-expanded={aberto}
              className="text-muted"
            >
              <span className={`inline-block transition-transform ${aberto ? "rotate-90" : ""}`}>
                ▸
              </span>
            </button>
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/pedidos/${pedido.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-ink hover:underline"
            >
              {pedido.name}
            </Link>
            {pedido.isKit && <KitBadge />}
            {pedido.isUnicaBox && <UnicaBoxBadge />}
          </div>
        </td>
        <td className="px-3 py-3 text-ink">
          {pedido.clienteNome ?? <span className="text-muted">—</span>}
        </td>
        <td className="px-3 py-3">
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-muted">
            <span>
              {total} {total === 1 ? "item" : "itens"}
            </span>
            <span className="h-1.5 w-[70px] overflow-hidden rounded-full bg-border">
              <span
                className="block h-full bg-oliva"
                style={{ width: `${total ? (prontos / total) * 100 : 0}%` }}
              />
            </span>
            <span className={completo ? "font-semibold text-oliva" : ""}>
              {completo ? "✓ completo" : `${prontos}/${total} produzidos`}
            </span>
          </span>
        </td>
        <td className="px-3 py-3 text-muted">
          {pedido.prazo ? (
            <>
              <span className="text-ink">{pedido.prazo}</span>
              {pedido.diasLabel && <span> ({pedido.diasLabel})</span>}
            </>
          ) : (
            "prazo especial"
          )}
        </td>
      </tr>
      {aberto &&
        pedido.items.map((item) => {
          const feito = !!feitos[item.id];
          return (
            <tr key={item.id} className="border-t border-dashed border-border-soft bg-header-bg/40">
              <td />
              <td colSpan={4} className="py-2 pr-3 pl-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={feito}
                    onChange={(e) => onMarcar(item.id, e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-vinho"
                  />
                  <span className={feito ? "text-muted line-through" : "text-ink"}>
                    {item.quantity}× <b>{item.title}</b>
                    {item.variantTitle && <span className="text-muted"> · {item.variantTitle}</span>}
                    {item.texto && (
                      <span className="ml-2 rounded-full bg-ocre-bg px-2 py-0.5 text-xs font-semibold text-ocre no-underline">
                        {item.texto}
                      </span>
                    )}
                  </span>
                </label>
              </td>
            </tr>
          );
        })}
    </>
  );
}
