"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface BoxData {
  id: string;
  numero: number;
  montada: boolean;
  finalizada: boolean;
  notaFiscalGerada: boolean;
  etiquetaGerada: boolean;
  despachado: boolean;
  orders: { id: string; name: string }[];
}

const CHECKLIST: { field: keyof BoxData; label: string }[] = [
  { field: "montada", label: "Caixa montada" },
  { field: "finalizada", label: "Caixa finalizada (todos os itens dentro)" },
  { field: "notaFiscalGerada", label: "Nota fiscal gerada" },
  { field: "etiquetaGerada", label: "Etiqueta de envio gerada" },
  { field: "despachado", label: "Despachado / coletado" },
];

function ChecklistRow({
  boxId,
  field,
  label,
  checked,
}: {
  boxId: string;
  field: string;
  label: string;
  checked: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(checked);

  async function toggle() {
    const next = !value;
    setValue(next);
    const res = await fetch(`/api/boxes/${boxId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value: next }),
    });
    if (!res.ok) {
      setValue(!next);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <label className="flex items-center gap-2 py-1.5 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={value}
        onChange={toggle}
        disabled={isPending}
        className="h-4 w-4 rounded border-border text-oliva focus:ring-oliva"
      />
      <span className={value ? "text-oliva" : "text-ink"}>{label}</span>
    </label>
  );
}

function StartBoxButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/box`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="rounded-full bg-vinho px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Criando..." : "Montar caixa"}
    </button>
  );
}

function AddOrderPicker({
  boxId,
  candidatos,
}: {
  boxId: string;
  candidatos: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar() {
    if (!selecionado) return;
    setLoading(true);
    setErro(null);
    const res = await fetch(`/api/boxes/${boxId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selecionado }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Falha ao agrupar pedido.");
      return;
    }
    setSelecionado("");
    router.refresh();
  }

  if (candidatos.length === 0) {
    return <p className="text-xs text-muted">Não há outros pedidos abertos sem caixa.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selecionado}
        onChange={(e) => setSelecionado(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-ink focus:border-vinho focus:outline-none"
      >
        <option value="">Agrupar pedido do mesmo cliente...</option>
        {candidatos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        onClick={adicionar}
        disabled={!selecionado || loading}
        className="rounded-full bg-border-soft px-3 py-1.5 text-xs font-semibold text-ink hover:bg-border disabled:opacity-50"
      >
        {loading ? "Agrupando..." : "Agrupar"}
      </button>
      {erro && <span className="text-xs text-vinho">{erro}</span>}
    </div>
  );
}

function RemoveFromBoxButton({ boxId, orderId }: { boxId: string; orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remover() {
    setLoading(true);
    const res = await fetch(`/api/boxes/${boxId}/orders/${orderId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={remover}
      disabled={loading}
      className="text-xs text-muted hover:text-vinho"
      title="Tirar da caixa"
    >
      remover
    </button>
  );
}

export function BoxChecklist({
  orderId,
  box,
  candidatos,
}: {
  orderId: string;
  box: BoxData | null;
  candidatos: { id: string; name: string }[];
}) {
  if (!box) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Este pedido ainda não tem caixa de envio.</p>
        <StartBoxButton orderId={orderId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px] font-bold text-muted">Caixa {box.numero}</p>

      <div>
        {CHECKLIST.map((item) => (
          <ChecklistRow
            key={item.field}
            boxId={box.id}
            field={item.field}
            label={item.label}
            checked={box[item.field] as boolean}
          />
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold text-muted">Pedidos agrupados nesta caixa</p>
        <ul className="space-y-1">
          {box.orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
              <Link
                href={`/pedidos/${o.id}`}
                className={o.id === orderId ? "font-semibold text-ink" : "text-ink hover:underline"}
              >
                {o.name}
                {o.id === orderId && " (este pedido)"}
              </Link>
              <RemoveFromBoxButton boxId={box.id} orderId={o.id} />
            </li>
          ))}
        </ul>
      </div>

      <AddOrderPicker boxId={box.id} candidatos={candidatos} />
    </div>
  );
}
