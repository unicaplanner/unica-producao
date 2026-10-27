import Link from "next/link";

// Alterna o Painel entre "Cartões" (visão de sempre) e "Lista" (tabela com
// os itens de cada pedido). A escolha vai na URL (?vista=lista).
export function ViewToggle({ vista }: { vista: "cartoes" | "lista" }) {
  const base = "rounded-full px-3.5 py-1 text-xs font-semibold";
  const on = "bg-vinho text-white";
  const off = "text-muted hover:text-ink";
  return (
    <div className="inline-flex rounded-full bg-border-soft p-[3px]">
      <Link href="/" className={`${base} ${vista === "cartoes" ? on : off}`}>
        Cartões
      </Link>
      <Link href="/?vista=lista" className={`${base} ${vista === "lista" ? on : off}`}>
        Lista
      </Link>
    </div>
  );
}
