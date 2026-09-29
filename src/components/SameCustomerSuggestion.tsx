"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Candidato {
  id: string;
  name: string;
}

// Aparece quando outro pedido aberto e pago tem o mesmo cliente (mesmo
// customerId do Shopify -- nunca nome/email, que a Shopify bloqueia pro
// nosso app no plano Basic) e ainda nao esta agrupado na mesma caixa.
export function SameCustomerSuggestion({
  boxId,
  candidatos: candidatosIniciais,
}: {
  boxId: string;
  candidatos: Candidato[];
}) {
  const router = useRouter();
  const [candidatos, setCandidatos] = useState(candidatosIniciais);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (candidatos.length === 0) return null;

  async function agrupar(candidato: Candidato) {
    setLoadingId(candidato.id);
    setErro(null);
    const res = await fetch(`/api/boxes/${boxId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: candidato.id }),
    });
    setLoadingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não consegui agrupar.");
      return;
    }
    setCandidatos((atual) => atual.filter((c) => c.id !== candidato.id));
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-md bg-ocre-bg p-3 text-sm text-ocre">
      <p className="font-semibold">
        Mesmo cliente em outro pedido aberto — agrupar na mesma caixa?
      </p>
      <ul className="mt-2 space-y-1.5">
        {candidatos.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span>{c.name}</span>
            <button
              onClick={() => agrupar(c)}
              disabled={loadingId === c.id}
              className="rounded-full bg-vinho px-3 py-0.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loadingId === c.id ? "Agrupando..." : "Agrupar"}
            </button>
          </li>
        ))}
      </ul>
      {erro && <p className="mt-1.5 text-xs">{erro}</p>}
    </div>
  );
}
