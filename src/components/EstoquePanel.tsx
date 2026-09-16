"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";

interface LowStockVariant {
  id: string;
  productTitle: string;
  variantTitle: string | null;
  sku: string | null;
  inventoryQuantity: number;
  stockQueueItems: { id: string; targetQuantity: number; producedQuantity: number }[];
}

interface QueueItem {
  id: string;
  productTitle: string;
  variantTitle: string | null;
  targetQuantity: number;
  producedQuantity: number;
  concluido: boolean;
  sincronizadoComShopify: boolean;
  sincronizadoEm: string | null;
}

interface VariantBasic {
  id: string;
  productTitle: string;
  variantTitle: string | null;
  inventoryQuantity: number;
}

function nomeVariante(productTitle: string, variantTitle: string | null) {
  return variantTitle ? `${productTitle} · ${variantTitle}` : productTitle;
}

function AddToQueueForm({ variantId, onDone }: { variantId: string; onDone: () => void }) {
  const [quantidade, setQuantidade] = useState("5");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    const targetQuantity = Number(quantidade);
    if (!targetQuantity || targetQuantity <= 0) {
      setErro("Quantidade inválida.");
      return;
    }
    setLoading(true);
    setErro(null);
    const res = await fetch("/api/stock/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, targetQuantity }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Falha ao adicionar à fila.");
      return;
    }
    onDone();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-ink focus:border-vinho focus:outline-none"
      />
      <button
        onClick={enviar}
        disabled={loading}
        className="rounded-full bg-vinho px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "..." : "Confirmar"}
      </button>
      {erro && <span className="text-xs text-vinho">{erro}</span>}
    </div>
  );
}

function LowStockRow({ variant }: { variant: LowStockVariant }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const filaAtiva = variant.stockQueueItems[0];

  return (
    <li className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0">
      <div>
        <p className="font-semibold text-ink">
          {nomeVariante(variant.productTitle, variant.variantTitle)}
        </p>
        {variant.sku && <p className="text-xs text-muted">SKU {variant.sku}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-vinho-bg px-2.5 py-0.5 text-xs font-semibold text-vinho">
          {variant.inventoryQuantity} em estoque
        </span>
        {filaAtiva ? (
          <span className="text-xs text-muted">
            na fila: {filaAtiva.producedQuantity}/{filaAtiva.targetQuantity} produzidas
          </span>
        ) : showForm ? (
          <AddToQueueForm variantId={variant.id} onDone={() => router.refresh()} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-border-soft px-3 py-1.5 text-xs font-semibold text-ink hover:bg-border"
          >
            Colocar na fila de produção
          </button>
        )}
      </div>
    </li>
  );
}

function ProducedInput({ item }: { item: QueueItem }) {
  const router = useRouter();
  const [valor, setValor] = useState(String(item.producedQuantity));
  const [loading, setLoading] = useState(false);

  async function salvar() {
    const producedQuantity = Number(valor);
    if (Number.isNaN(producedQuantity) || producedQuantity < 0) return;
    setLoading(true);
    const res = await fetch(`/api/stock/queue/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producedQuantity }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={salvar}
        disabled={loading}
        className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-ink focus:border-vinho focus:outline-none"
      />
      <span className="text-sm text-muted">/ {item.targetQuantity} produzidas</span>
    </div>
  );
}

function SyncToShopifyPrompt({ item }: { item: QueueItem }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dispensado, setDispensado] = useState(false);

  async function confirmar() {
    setLoading(true);
    setErro(null);
    const res = await fetch(`/api/stock/queue/${item.id}/sync-shopify`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Falha ao atualizar estoque no Shopify.");
      return;
    }
    router.refresh();
  }

  if (dispensado) return null;

  return (
    <div className="mt-2 rounded-md bg-ocre-bg p-3 text-sm text-ocre">
      <p className="font-semibold">
        Lote concluído — {item.producedQuantity} unidades produzidas.
      </p>
      <p className="mt-0.5">Quer somar isso ao estoque desse produto no Shopify agora?</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={confirmar}
          disabled={loading}
          className="rounded-full bg-vinho px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Sim, atualizar"}
        </button>
        <button
          onClick={() => setDispensado(true)}
          className="rounded-full bg-border-soft px-3 py-1 text-xs font-semibold text-ink hover:bg-border"
        >
          Não, por enquanto
        </button>
        {erro && <span className="text-xs text-vinho">{erro}</span>}
      </div>
    </div>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function remover() {
    setRemoving(true);
    const res = await fetch(`/api/stock/queue/${item.id}`, { method: "DELETE" });
    setRemoving(false);
    if (res.ok) router.refresh();
  }

  return (
    <li className="border-b border-border px-4 py-3 text-sm last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-ink">
            {nomeVariante(item.productTitle, item.variantTitle)}
          </p>
          {item.sincronizadoComShopify ? (
            <p className="mt-0.5 text-xs text-oliva">
              ✓ Estoque atualizado no Shopify
              {item.sincronizadoEm &&
                ` em ${new Date(item.sincronizadoEm).toLocaleDateString("pt-BR")}`}
            </p>
          ) : (
            <ProducedInput item={item} />
          )}
        </div>
        <button
          onClick={remover}
          disabled={removing}
          className="text-xs text-muted hover:text-vinho"
        >
          remover
        </button>
      </div>
      {item.concluido && !item.sincronizadoComShopify && <SyncToShopifyPrompt item={item} />}
    </li>
  );
}

function AddManualForm({ variantes }: { variantes: VariantBasic[] }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState("");
  const [quantidade, setQuantidade] = useState("5");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar() {
    if (!variantId) return;
    const targetQuantity = Number(quantidade);
    if (!targetQuantity || targetQuantity <= 0) {
      setErro("Quantidade inválida.");
      return;
    }
    setLoading(true);
    setErro(null);
    const res = await fetch("/api/stock/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, targetQuantity }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Falha ao adicionar à fila.");
      return;
    }
    setVariantId("");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border-soft px-4 py-3">
      <select
        value={variantId}
        onChange={(e) => setVariantId(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-ink focus:border-vinho focus:outline-none"
      >
        <option value="">Adicionar produto à fila...</option>
        {variantes.map((v) => (
          <option key={v.id} value={v.id}>
            {nomeVariante(v.productTitle, v.variantTitle)} ({v.inventoryQuantity} em estoque)
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-ink focus:border-vinho focus:outline-none"
      />
      <button
        onClick={adicionar}
        disabled={!variantId || loading}
        className="rounded-full bg-border-soft px-3 py-1.5 text-xs font-semibold text-ink hover:bg-border disabled:opacity-50"
      >
        {loading ? "Adicionando..." : "Adicionar"}
      </button>
      {erro && <span className="text-xs text-vinho">{erro}</span>}
    </div>
  );
}

export function EstoquePanel({
  lowStock,
  queue,
  variantesBasic,
}: {
  lowStock: LowStockVariant[];
  queue: QueueItem[];
  variantesBasic: VariantBasic[];
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-[12px] font-bold text-muted">
          Estoque baixo (menos de {LOW_STOCK_THRESHOLD} unidades)
        </h2>
        {lowStock.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-6 text-center text-sm text-muted">
            Nenhum produto com estoque baixo. 🎉
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[10px] border border-border">
            {lowStock.map((v) => (
              <LowStockRow key={v.id} variant={v} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[12px] font-bold text-muted">Fila de produção para estoque</h2>
        <div className="overflow-hidden rounded-[10px] border border-border">
          {queue.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              Nenhum item na fila. Adicione um produto acima ou aqui embaixo.
            </p>
          ) : (
            <ul>
              {queue.map((item) => (
                <QueueRow key={item.id} item={item} />
              ))}
            </ul>
          )}
          <AddManualForm variantes={variantesBasic} />
        </div>
      </section>
    </div>
  );
}
