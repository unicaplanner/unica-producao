import Link from "next/link";
import { SyncButton } from "@/components/SyncButton";
import { LogoutButton } from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Central de Produção</h1>
            <nav className="mt-1 flex gap-4 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900">
                Painel
              </Link>
              <Link href="/pedidos" className="hover:text-gray-900">
                Pedidos
              </Link>
              <Link href="/produtos" className="hover:text-gray-900">
                Produtos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <SyncButton />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
