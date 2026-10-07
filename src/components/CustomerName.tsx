"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Nome da cliente na tela do pedido: o Shopify nao libera o nome pro nosso
// app, entao ele e digitado uma vez e vale pra todos os pedidos dela.
export function CustomerName({
  customerId,
  nome: nomeInicial,
}: {
  customerId: string | null;
  nome: string | null;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeInicial);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nomeInicial ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!customerId) return null;

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const res = await fetch("/api/customers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, nome: valor }),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não consegui salvar.");
      return;
    }
    const data = await res.json();
    setNome(data.nome);
    setEditando(false);
    router.refresh();
  }

  if (editando) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
        className="mt-1 flex flex-wrap items-center gap-2"
      >
        <input
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Nome da cliente"
          maxLength={120}
          className="rounded-md border border-border bg-card px-2.5 py-1 text-sm text-ink outline-none focus:border-vinho"
        />
        <button
          type="submit"
          disabled={salvando}
          className="rounded-full bg-vinho px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setValor(nome ?? "");
            setErro(null);
          }}
          className="text-xs text-muted hover:text-ink"
        >
          Cancelar
        </button>
        {erro && <span className="text-xs text-vinho">{erro}</span>}
      </form>
    );
  }

  return (
    <p className="mt-1 text-sm">
      {nome ? (
        <>
          <span className="font-semibold text-ink">{nome}</span>{" "}
          <button onClick={() => setEditando(true)} className="text-xs text-muted hover:text-ink">
            (editar)
          </button>
        </>
      ) : (
        <button onClick={() => setEditando(true)} className="text-vinho hover:underline">
          + Adicionar nome da cliente
        </button>
      )}
    </p>
  );
}
