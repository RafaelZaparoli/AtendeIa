import Link from "next/link";
import { ChatExperience } from "@/app/chat/demo/page";
import { getSupabaseClient } from "@/lib/supabaseClient";

type PublicChatPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicChatPage({ params }: PublicChatPageProps) {
  const { slug } = await params;

  try {
    const supabase = getSupabaseClient();
    const { data: company, error } = await supabase
      .from("companies")
      .select("id, name, city, state")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!company) {
      return <CompanyNotFound />;
    }

    const companyLocation = [company.city, company.state]
      .filter(Boolean)
      .join(" - ");

    return (
      <ChatExperience
        fixedCompanyId={company.id}
        companyName={company.name}
        companyLocation={companyLocation}
      />
    );
  } catch (error) {
    console.error("Failed to load public company chat:", error);
    return <CompanyNotFound />;
  }
}

function CompanyNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud px-5 text-ink">
      <div className="w-full max-w-lg rounded-lg border border-ink/10 bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
          AtendeAI
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Empresa não encontrada.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          Verifique o link publico e tente novamente.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-moss"
        >
          Voltar ao inicio
        </Link>
      </div>
    </main>
  );
}
