"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na sincronizacao.");
      setMessage(`${data.ordersSynced} pedidos sincronizados.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro desconhecido.");
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
      {message && <span className="text-sm text-muted">{message}</span>}
    </div>
  );
}
