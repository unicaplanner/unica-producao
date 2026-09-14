"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Senha incorreta.");
      return;
    }
    router.push(searchParams.get("next") ?? "/");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-[14px] bg-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
    >
      <div>
        <h1 className="text-lg font-bold text-ink">Central de Produção</h1>
        <p className="text-sm text-muted">Unica Planner</p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        autoFocus
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-ink focus:border-vinho focus:outline-none"
      />
      {error && <p className="text-sm text-vinho">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-vinho px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
