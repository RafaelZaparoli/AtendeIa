import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Resumo" },
  { href: "/dashboard/configuracoes", label: "Configuracoes" },
  { href: "/chat/demo", label: "Chat Demo" },
  { href: "/dashboard/conversas", label: "Conversas" },
  { href: "/dashboard/agendamentos", label: "Agendamentos" }
];

export function DashboardLayout({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cloud text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink/10 bg-white px-5 py-6 lg:block">
        <Link href="/" className="mb-8 block text-xl font-black tracking-tight">
          AtendeAI
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-4 py-3 text-sm font-semibold text-ink/70 transition hover:bg-mint hover:text-moss"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="border-b border-ink/10 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">
                Painel
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/60">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md bg-cloud px-3 py-2 text-xs font-semibold"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
