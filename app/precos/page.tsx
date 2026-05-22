import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";

const demoMessage =
  "Olá, tenho interesse no AtendeAI e gostaria de uma demonstração.";
const whatsappDemoLink = `https://wa.me/?text=${encodeURIComponent(demoMessage)}`;

const plans = [
  {
    name: "Inicial",
    implementation: "R$197 implantação",
    monthly: "R$49/mês",
    description: "Para colocar o assistente no ar com o essencial.",
    features: [
      "Assistente virtual configurado",
      "Link público para colocar na bio",
      "Respostas sobre serviços, horários e preços",
      "Solicitação de agendamento",
      "Suporte inicial"
    ]
  },
  {
    name: "Profissional",
    implementation: "R$397 implantação",
    monthly: "R$97/mês",
    description: "Para acompanhar horários e agir pelo painel.",
    featured: true,
    features: [
      "Tudo do Inicial",
      "Painel de agendamentos",
      "Horários disponíveis e indisponíveis",
      "Botão para confirmar pelo WhatsApp",
      "QR Code do link público",
      "Ajustes mensais"
    ]
  },
  {
    name: "Premium",
    implementation: "R$697 implantação",
    monthly: "R$147/mês",
    description: "Para uma presença mais personalizada.",
    features: [
      "Tudo do Profissional",
      "Personalização visual",
      "Página simples da empresa",
      "Relatório mensal",
      "Suporte prioritário"
    ]
  }
];

export default function PrecosPage() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
        <Link href="/" className="text-xl font-black tracking-tight">
          AtendeAI
        </Link>
        <nav className="flex items-center gap-2">
          <ButtonLink href="/chat/demo" variant="ghost">
            Demo
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            Painel
          </ButtonLink>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-14 pt-8 md:pb-16 md:pt-12">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-moss">
            Planos para atendimento e agendamento online
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
            Escolha o plano ideal para seu negócio
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/68">
            Atendimento automático, agendamento online e painel para acompanhar
            seus clientes.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex min-h-full flex-col rounded-lg border p-5 shadow-sm md:p-6 ${
                plan.featured
                  ? "border-moss bg-ink text-white shadow-soft"
                  : "border-ink/10 bg-white"
              }`}
            >
              <div className="border-b border-current/10 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-[0.16em] ${
                        plan.featured ? "text-mint" : "text-coral"
                      }`}
                    >
                      Plano
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">
                      {plan.name}
                    </h2>
                  </div>
                  {plan.featured && (
                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-moss">
                      Popular
                    </span>
                  )}
                </div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    plan.featured ? "text-white/68" : "text-ink/58"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="mt-5">
                  <p className="text-sm font-bold">{plan.implementation}</p>
                  <p className="mt-1 text-3xl font-black tracking-tight">
                    {plan.monthly}
                  </p>
                </div>
              </div>

              <ul className="mt-5 grid flex-1 gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6">
                    <span
                      aria-hidden="true"
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                        plan.featured ? "bg-mint" : "bg-moss"
                      }`}
                    />
                    <span className={plan.featured ? "text-white/84" : "text-ink/72"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={whatsappDemoLink}
                target="_blank"
                rel="noreferrer"
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-mint text-moss hover:bg-white"
                    : "bg-ink text-white hover:bg-moss"
                }`}
              >
                Quero uma demonstração
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white px-5 py-14 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
              Próximo passo
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Ainda está em dúvida?
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/62">
              Veja como o assistente responde, oferece horários e registra uma
              solicitação de agendamento.
            </p>
          </div>
          <ButtonLink href="/chat/demo">Ver demonstração</ButtonLink>
        </div>
      </section>
    </main>
  );
}
