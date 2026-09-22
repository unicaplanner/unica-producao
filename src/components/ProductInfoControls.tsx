"use client";

import { useEffect, useRef, useState } from "react";

// So links http/https sao abertos pelo navegador. Qualquer outra coisa
// (caminho tipo D:\pasta\arquivo.pdf, ou file:///D:/pasta/arquivo.pdf) e
// tratada como caminho local: navegador BLOQUEIA um site abrir arquivo do
// computador por seguranca (testado -- window.open pra file:// nao faz
// nada, silenciosamente), entao o clique copia o caminho em vez de abrir.
export function isWebLink(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// Se for um link "file:///D:/pasta/arquivo.pdf" (o que o navegador mostra
// quando voce abre um PDF local nele e copia da barra de endereco),
// devolve o caminho limpo "D:\pasta\arquivo.pdf" pra colar direto no
// Explorer. Decodifica %20 etc. Caso contrario devolve o valor como esta.
export function toExplorerPath(value: string): string {
  const match = /^file:\/\/\/?([A-Za-z]:\/.*)$/i.exec(value);
  if (!match) return value;
  try {
    return decodeURIComponent(match[1]).replace(/\//g, "\\");
  } catch {
    return value;
  }
}

// Aceita "unicaplanner.com.br/produto" sem o https:// na frente.
export function normalizeSiteUrl(value: string): string {
  const v = value.trim();
  if (v === "" || /^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  return `https://${v}`;
}

const SVG_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function FileIcon({ className }: { className?: string }) {
  return (
    <svg {...SVG_PROPS} className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

// Tudo aqui dentro vive no <summary> do grupo: todo clique precisa parar de
// propagar (senao o grupo abre/fecha junto) e garantir o grupo aberto, pra
// o formulario que aparece embaixo ficar visivel.
function keepOpenAndStop(e: React.MouseEvent<HTMLElement>) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.closest("details")?.setAttribute("open", "");
}

// Icone de arquivo ao lado do nome: sem link cadastrado abre o formulario;
// com link, o clique vai direto pro arquivo.
export function PrintFileIcon({ url, onRegister }: { url: string | null; onRegister: () => void }) {
  const [aviso, setAviso] = useState<string | null>(null);

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    keepOpenAndStop(e);
    if (!url) {
      onRegister();
      return;
    }
    if (isWebLink(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await navigator.clipboard.writeText(toExplorerPath(url));
      setAviso("Caminho copiado");
    } catch {
      setAviso("Não consegui copiar");
    }
    setTimeout(() => setAviso(null), 2500);
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={url ? "Abrir arquivo de impressão" : "Cadastrar arquivo de impressão"}
        title={url ? (isWebLink(url) ? url : toExplorerPath(url)) : "Cadastrar arquivo de impressão (PDF)"}
        className={`rounded-md p-1 transition-colors ${
          url
            ? "bg-vinho-bg text-vinho hover:bg-vinho-border"
            : "text-muted/60 hover:bg-border-soft hover:text-ink"
        }`}
      >
        <FileIcon className="h-4 w-4" />
      </button>
      {aviso && <span className="text-[11px] font-normal text-oliva">{aviso}</span>}
    </span>
  );
}

export type InfoKind = "print" | "site" | "specs";

// Menu dos tres pontinhos, na lateral direita do cabecalho do grupo.
export function ProductMenu({
  siteUrl,
  printUrl,
  onEdit,
}: {
  siteUrl: string | null;
  printUrl: string | null;
  onEdit: (kind: InfoKind) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function escolher(e: React.MouseEvent<HTMLElement>, acao: () => void) {
    keepOpenAndStop(e);
    setAberto(false);
    acao();
  }

  const itemClass =
    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-ink hover:bg-header-bg";

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          keepOpenAndStop(e);
          setAberto((v) => !v);
        }}
        aria-label="Mais opções"
        aria-expanded={aberto}
        title="Mais opções"
        className="rounded-md p-1 text-muted hover:bg-border-soft hover:text-ink"
      >
        <DotsIcon className="h-5 w-5" />
      </button>

      {aberto && (
        <div
          role="menu"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-[10px] border border-border bg-card py-1 font-normal shadow-lg"
        >
          <div className={itemClass}>
            <button
              type="button"
              role="menuitem"
              onClick={(e) =>
                escolher(e, () => {
                  if (siteUrl) window.open(siteUrl, "_blank", "noopener,noreferrer");
                  else onEdit("site");
                })
              }
              className="flex-1 text-left"
            >
              Link do site
            </button>
            {siteUrl && (
              <button
                type="button"
                onClick={(e) => escolher(e, () => onEdit("site"))}
                className="text-xs text-muted hover:text-vinho"
              >
                alterar
              </button>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => escolher(e, () => onEdit("specs"))}
            className={itemClass}
          >
            Especificações do produto
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => escolher(e, () => onEdit("print"))}
            className={itemClass}
          >
            {printUrl ? "Alterar caminho do arquivo" : "Cadastrar caminho do arquivo"}
          </button>
        </div>
      )}
    </span>
  );
}

// Formulario que aparece embaixo do cabecalho do grupo (fora do <summary>,
// pra digitar sem mexer no abre/fecha).
export function InfoForm({
  titulo,
  placeholder,
  hint,
  multiline,
  initialValue,
  onSave,
  onCancel,
}: {
  titulo: string;
  placeholder: string;
  hint?: string;
  multiline?: boolean;
  initialValue: string | null;
  onSave: (value: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [valor, setValor] = useState(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(novoValor: string) {
    setLoading(true);
    setErro(null);
    const falha = await onSave(novoValor);
    setLoading(false);
    if (falha) setErro(falha);
  }

  const inputClass =
    "min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-vinho focus:outline-none";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar(valor);
      }}
      className="border-t border-border bg-card px-4 py-3"
    >
      <p className="mb-1.5 text-xs font-bold text-muted">{titulo}</p>
      <div className="flex flex-wrap items-start gap-2">
        {multiline ? (
          <textarea
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={placeholder}
            rows={4}
            autoFocus
            className={`${inputClass} w-full flex-none`}
          />
        ) : (
          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className={inputClass}
          />
        )}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || valor.trim() === ""}
            className="rounded-full bg-vinho px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-border-soft px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-border"
          >
            Cancelar
          </button>
          {initialValue && (
            <button
              type="button"
              onClick={() => enviar("")}
              disabled={loading}
              className="text-xs text-muted hover:text-vinho"
            >
              remover
            </button>
          )}
        </div>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-muted">{hint}</p>}
      {erro && <p className="mt-1 text-xs text-vinho">{erro}</p>}
    </form>
  );
}
