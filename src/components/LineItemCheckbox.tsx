"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LineItemCheckbox({
  lineItemId,
  produzido,
}: {
  lineItemId: string;
  produzido: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(produzido);

  async function toggle() {
    const next = !checked;
    setChecked(next);
    const res = await fetch(`/api/line-items/${lineItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produzido: next }),
    });
    if (!res.ok) {
      setChecked(!next);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        disabled={isPending}
        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className={checked ? "line-through text-gray-400" : ""}>
        {checked ? "Produzido" : "Marcar como produzido"}
      </span>
    </label>
  );
}
