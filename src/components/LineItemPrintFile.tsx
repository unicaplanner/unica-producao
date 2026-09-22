"use client";

import { useState } from "react";
import { InfoForm, PrintFileIcon } from "@/components/ProductInfoControls";

// Mesmo icone/formulario de arquivo de impressao da tela "Agrupado por
// item", só que solto (fora de um <summary>/<details>) pra usar na lista
// de itens do pedido.
export function LineItemPrintFile({
  itemKey,
  initialUrl,
}: {
  itemKey: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [editando, setEditando] = useState(false);

  async function salvar(valor: string): Promise<string | null> {
    const res = await fetch("/api/product-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: itemKey, field: "printUrl", value: valor }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return data?.error ?? "Não consegui salvar.";
    setUrl(data.info.printUrl);
    setEditando(false);
    return null;
  }

  return (
    <div>
      <PrintFileIcon url={url} onRegister={() => setEditando(true)} />
      {editando && (
        <div className="mt-2 w-72">
          <InfoForm
            titulo="Arquivo de impressão (PDF)"
            placeholder="Cole o link ou o caminho do PDF"
            hint="Link (Drive, Dropbox…) abre direto ao clicar no ícone — pra isso funcionar em 1 clique, o PDF precisa estar num link assim. Caminho do computador (D:\pasta\arquivo.pdf, ou o file:///D:/... que o navegador mostra ao abrir um PDF local) é copiado ao clicar em vez de abrir: nenhum site consegue abrir arquivo do seu computador, é bloqueio do navegador."
            initialValue={url}
            onSave={salvar}
            onCancel={() => setEditando(false)}
          />
        </div>
      )}
    </div>
  );
}
