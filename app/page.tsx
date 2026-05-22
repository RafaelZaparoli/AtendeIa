import { ButtonLink } from "@/components/ButtonLink";
import { ChatPreview } from "@/components/ChatPreview";

const features = [
  {
    title: "Responde com contexto",
    text: "Use servicos, precos, horarios, formas de pagamento e regras do negocio como base para cada resposta."
  },
  {
    title: "Organiza conversas",
    text: "Veja os contatos, status e ultimas mensagens em um painel simples para acompanhar o atendimento."
  },
  {
    title: "Pronto para pequenos times",
    text: "Uma experiencia direta para configurar a empresa e testar a IA antes de conectar canais reais."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
        <div className="text-xl font-black tracking-tight">AtendeAI</div>
        <nav className="flex items-center gap-2">
          <ButtonLink href="/precos" variant="ghost">
            Preços
          </ButtonLink>
          <ButtonLink href="/chat/demo" variant="ghost">
            Demo
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            Painel
          </ButtonLink>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
        <div>
          <p className="mb-5 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-bold text-moss">
            Atendimento inteligente sem complicar a operacao
          </p>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Atendimento com IA para pequenos negócios
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/68">
            Cadastre informacoes da sua empresa e deixe a IA responder clientes
            com clareza sobre servicos, valores, horarios, pagamentos e regras
            importantes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/chat/demo">Testar demo</ButtonLink>
            <ButtonLink href="/precos" variant="secondary">
              Ver preços
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Entrar no painel
            </ButtonLink>
          </div>
        </div>
        <ChatPreview />
      </section>

      <section className="border-y border-ink/10 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
              Funcionalidades
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              O essencial para comecar a atender melhor
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-ink/10 bg-cloud p-6"
              >
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/62">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
            Conversa guiada
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            A IA responde sem perder o jeito da empresa
          </h2>
          <p className="mt-4 text-base leading-7 text-ink/65">
            Defina tom de voz, perguntas frequentes e regras para a IA manter
            respostas uteis, consistentes e alinhadas com o atendimento real.
          </p>
        </div>
        <ChatPreview />
      </section>

      <section className="bg-ink px-5 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              Configure hoje a primeira versao do seu atendimento
            </h2>
            <p className="mt-3 max-w-2xl text-white/70">
              Teste a experiencia visual, ajuste os dados da empresa e simule
              conversas antes de conectar canais reais.
            </p>
          </div>
          <ButtonLink href="/dashboard/configuracoes" variant="secondary">
            Configurar empresa
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
