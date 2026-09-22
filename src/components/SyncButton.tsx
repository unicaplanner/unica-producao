"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Shopify devolve o erro cru de GraphQL (um JSON gigante) -- isso nunca deve
// aparecer na tela pra usuaria. Traduz os casos conhecidos e corta o resto.
function friendlyProductsError(raw: string): string {
  if (raw.includes("ACCESS_DENIED") || raw.toLowerCase().includes("access denied")) {
    return "faltam permissões no app do Shopify (veja as instruções de escopo).";
  }
  const short = raw.length > 100 ? `${raw.slice(0, 100)}…` : raw;
  return short;
}

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function sync() {
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na sincronizacao.");
      if (data.productsError) {
        setMessage(
          `${data.ordersSynced} pedidos sincronizados. Produtos não sincronizaram: ${friendlyProductsError(data.productsError)}`
        );
        setIsError(true);
      } else {
        setMessage(
          `${data.ordersSynced} pedidos e ${data.productsSynced} produtos sincronizados.`
        );
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro desconhecido.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={sync}
        disabled={loading}
        className="rounded-full bg-vinho px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sincronizando..." : "Sincronizar agora"}
      </button>
      {message && (
        <span className={`max-w-xs text-xs ${isError ? "text-ocre" : "text-muted"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
