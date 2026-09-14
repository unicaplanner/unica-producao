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
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        disabled={isPending}
        className="h-4 w-4 rounded border-border text-oliva focus:ring-oliva"
      />
      <span className={checked ? "text-oliva line-through" : "text-muted"}>
        {checked ? "Produzido" : "Marcar como produzido"}
      </span>
    </label>
  );
}
