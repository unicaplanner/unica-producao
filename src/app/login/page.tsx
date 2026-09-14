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
      className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
    >
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Central de Produção</h1>
        <p className="text-sm text-gray-500">Unica Planner</p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        autoFocus
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
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
