"use client";

import { createContext, useContext, useState } from "react";

interface Selection {
  selected: string[];
  toggle: (id: string) => void;
  setMany: (ids: string[], on: boolean) => void;
  clear: () => void;
}

const SelectionContext = createContext<Selection | null>(null);

function useSelection(): Selection {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("OrderSelection fora do OrderSelectionProvider");
  return ctx;
}

// Guarda quais pedidos estao marcados (na ordem em que foram marcados) pra
// imprimir as fichas A5 de varios de uma vez. Envolve a lista inteira.
export function OrderSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);

  const value: Selection = {
    selected,
    toggle: (id) =>
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    setMany: (ids, on) =>
      setSelected((s) =>
        on ? [...s, ...ids.filter((id) => !s.includes(id))] : s.filter((id) => !ids.includes(id))
      ),
    clear: () => setSelected([]),
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
      <SelectionBar />
    </SelectionContext.Provider>
  );
}

export function OrderSelectBox({ id, label }: { id: string; label: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      checked={selected.includes(id)}
      onChange={() => toggle(id)}
      aria-label={`Selecionar ${label}`}
      className="h-4 w-4 shrink-0 cursor-pointer accent-vinho"
    />
  );
}

// "Selecionar todos" de um grupo de pedidos (uma secao do painel, ou a
// tabela filtrada em Por pedido).
export function SelectAllBox({ ids, label }: { ids: string[]; label: string }) {
  const { selected, setMany } = useSelection();
  const todos = ids.length > 0 && ids.every((id) => selected.includes(id));
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-normal text-muted">
      <input
        type="checkbox"
        checked={todos}
        onChange={() => setMany(ids, !todos)}
        className="h-4 w-4 cursor-pointer accent-vinho"
      />
      {label}
    </label>
  );
}

function SelectionBar() {
  const { selected, clear } = useSelection();
  if (selected.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
        <span className="text-sm font-semibold text-ink">
          {selected.length} selecionado{selected.length === 1 ? "" : "s"}
        </span>
        <a
          href={`/imprimir/pedidos?ids=${selected.map(encodeURIComponent).join(",")}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-vinho px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Imprimir fichas A5
        </a>
        <button onClick={clear} className="text-xs text-muted hover:text-ink">
          Limpar
        </button>
      </div>
    </div>
  );
}
