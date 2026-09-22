"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatCustomAttributes,
  type ProductGroup,
  type ProductInfoData,
} from "@/lib/productGroups";
import { LineItemCheckbox } from "@/components/LineItemCheckbox";
import {
  InfoForm,
  PrintFileIcon,
  ProductMenu,
  normalizeSiteUrl,
  type InfoKind,
} from "@/components/ProductInfoControls";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function titleMatches(grupo: ProductGroup, termo: string): boolean {
  if (normalize(grupo.title).includes(termo)) return true;
  return Boolean(grupo.variantTitle && normalize(grupo.variantTitle).includes(termo));
}

function pedidoMatches(p: ProductGroup["pedidos"][number], termo: string): boolean {
  if (normalize(p.orderName).includes(termo)) return true;
  return p.customAttributes.some(
    (a) => normalize(a.key).includes(termo) || normalize(a.value).includes(termo),
  );
}

// Se o termo bate no nome do produto, mostra o grupo inteiro (todos os
// pedidos). Se so bate em pedidos/textos especificos dentro do grupo,
// mostra so essas linhas -- assim buscar "Fé" acha so a unidade certa
// dentro de "Aba Divisória Personalizada", nao as 3.
function filterGroup(grupo: ProductGroup, termo: string): ProductGroup | null {
  if (titleMatches(grupo, termo)) return grupo;
  const pedidos = grupo.pedidos.filter((p) => pedidoMatches(p, termo));
  if (pedidos.length === 0) return null;
  const quantidadePendente = pedidos.reduce((sum, p) => sum + p.quantity, 0);
  return { ...grupo, pedidos, quantidadePendente };
}

const FORM_CONFIG: Record<
  InfoKind,
  {
    field: keyof ProductInfoData;
    titulo: string;
    placeholder: string;
    hint?: string;
    multiline?: boolean;
  }
> = {
  print: {
    field: "printUrl",
    titulo: "Arquivo de impressão (PDF)",
    placeholder: "Cole o link ou o caminho do PDF",
    hint: "Link (Drive, Dropbox…) abre direto ao clicar no ícone — pra isso funcionar em 1 clique, o PDF precisa estar num link assim. Caminho do computador (D:\\pasta\\arquivo.pdf, ou o file:///D:/... que o navegador mostra ao abrir um PDF local) é copiado ao clicar em vez de abrir: nenhum site consegue abrir arquivo do seu computador, é bloqueio do navegador.",
  },
  site: {
    field: "siteUrl",
    titulo: "Link do produto no site",
    placeholder: "Cole o link da página do produto",
  },
  specs: {
    field: "specs",
    titulo: "Especificações do produto",
    placeholder: "Tamanho, papel, gramatura, acabamento…",
    multiline: true,
  },
};

const SEM_INFO: ProductInfoData = { printUrl: null, siteUrl: null, specs: null };

export function ProdutosList({
  grupos,
  info: infoInicial,
  autoSiteUrls,
}: {
  grupos: ProductGroup[];
  info: Record<string, ProductInfoData>;
  autoSiteUrls: Record<string, string>;
}) {
  const [busca, setBusca] = useState("");
  const [info, setInfo] = useState(infoInicial);
  const [editando, setEditando] = useState<{ key: string; kind: InfoKind } | null>(null);

  async function salvarCampo(key: string, kind: InfoKind, valor: string): Promise<string | null> {
    const { field } = FORM_CONFIG[kind];
    const value = kind === "site" ? normalizeSiteUrl(valor) : valor;
    const res = await fetch("/api/product-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, field, value }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return data?.error ?? "Não consegui salvar.";
    setInfo((atual) => ({ ...atual, [key]: data.info }));
    setEditando(null);
    return null;
  }

  const filtrados = useMemo(() => {
    const termo = normalize(busca.trim());
    if (!termo) return grupos;
    return grupos.map((g) => filterGroup(g, termo)).filter((g): g is ProductGroup => g !== null);
  }, [grupos, busca]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por produto, pedido ou texto personalizado..."
        className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-vinho focus:outline-none"
      />

      {filtrados.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-muted">
          Nenhum item encontrado para &quot;{busca}&quot;.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((grupo) => {
            const dados = info[grupo.key] ?? SEM_INFO;
            const siteAuto = autoSiteUrls[grupo.title] ?? null;
            const config = editando?.key === grupo.key ? FORM_CONFIG[editando.kind] : null;
            return (
              <details key={grupo.key} className="rounded-[10px] bg-header-bg" open>
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-muted">
                      {grupo.title}
                      {grupo.variantTitle && (
                        <span className="font-normal"> · {grupo.variantTitle}</span>
                      )}
                    </p>
                    <PrintFileIcon
                      url={dados.printUrl}
                      onRegister={() => setEditando({ key: grupo.key, kind: "print" })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap rounded-full bg-vinho px-3 py-1 text-xs font-semibold text-white">
                      {grupo.quantidadePendente} pendente{grupo.quantidadePendente === 1 ? "" : "s"}
                    </span>
                    <ProductMenu
                      siteUrl={dados.siteUrl ?? siteAuto}
                      printUrl={dados.printUrl}
                      onEdit={(kind) => setEditando({ key: grupo.key, kind })}
                    />
                  </div>
                </summary>
                {editando && config && (
                  <InfoForm
                    key={editando.kind}
                    titulo={config.titulo}
                    placeholder={config.placeholder}
                    hint={
                      editando.kind === "site" && siteAuto
                        ? "Esse produto já tem link automático do Shopify. Só cadastre aqui se quiser usar outro; remover volta ao automático."
                        : config.hint
                    }
                    multiline={config.multiline}
                    initialValue={dados[config.field]}
                    onSave={(valor) => salvarCampo(grupo.key, editando.kind, valor)}
                    onCancel={() => setEditando(null)}
                  />
                )}
                <ul className="border-t border-border">
                  {grupo.pedidos.map((p) => {
                    const texto = formatCustomAttributes(p.customAttributes);
                    return (
                      <li
                        key={p.lineItemId}
                        className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
                      >
                        <Link href={`/pedidos/${p.orderId}`} className="text-ink hover:underline">
                          {p.orderName} · {p.quantity}× · prazo{" "}
                          {p.prazoLimite.toLocaleDateString("pt-BR")}
                          {texto && (
                            <span className="ml-2 rounded-full bg-ocre-bg px-2 py-0.5 text-xs font-semibold text-ocre">
                              {texto}
                            </span>
                          )}
                        </Link>
                        <LineItemCheckbox lineItemId={p.lineItemId} produzido={false} />
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
