import { SyncButton } from "@/components/SyncButton";
import { LogoutButton } from "@/components/LogoutButton";
import { NavTabs } from "@/components/NavTabs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border-soft">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-ink">Central de Produção</h1>
            <p className="text-xs text-muted">Unica Planner</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavTabs />
            <SyncButton />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="rounded-[14px] bg-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          {children}
        </div>
      </main>
    </div>
  );
}
