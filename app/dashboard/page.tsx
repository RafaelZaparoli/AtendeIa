import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";

const quickLinks = [
  {
    href: "/dashboard/configuracoes",
    title: "Configuracoes",
    text: "Edite dados, regras e tom da IA."
  },
  {
    href: "/chat/demo",
    title: "Chat Demo",
    text: "Teste como o assistente responde clientes."
  },
  {
    href: "/dashboard/conversas",
    title: "Conversas",
    text: "Acompanhe historicos e status mockados."
  }
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Resumo do atendimento"
      description="Uma visao inicial com dados ficticios para orientar a primeira experiencia do SaaS."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Conversas hoje" value="42" detail="+18% vs. ontem" />
        <StatCard label="Resolvidas pela IA" value="31" detail="74% sem intervencao" />
        <StatCard label="Tempo medio" value="1m 12s" detail="Resposta inicial" />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight">Movimento do dia</h2>
          <div className="mt-6 grid h-56 grid-cols-7 items-end gap-3">
            {[42, 64, 38, 70, 56, 84, 62].map((height, index) => (
              <div key={height} className="flex h-full flex-col justify-end gap-2">
                <div
                  className="rounded-t-md bg-moss"
                  style={{ height: `${height}%` }}
                />
                <span className="text-center text-xs font-semibold text-ink/50">
                  {["S", "T", "Q", "Q", "S", "S", "D"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight">Acessos rapidos</h2>
          <div className="mt-5 space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg border border-ink/10 p-4 transition hover:border-moss hover:bg-mint"
              >
                <p className="font-black">{link.title}</p>
                <p className="mt-1 text-sm text-ink/60">{link.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
