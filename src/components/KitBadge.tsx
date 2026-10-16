// Selo de pedido so de kits prontos (ver lib/kits.ts).
export function KitBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-vinho px-2.5 py-0.5 text-xs font-semibold text-white">
      ★ Kit prioritário
    </span>
  );
}
