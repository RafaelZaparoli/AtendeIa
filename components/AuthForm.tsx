"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

function getDashboardRedirect(nextPath: string | null) {
  return nextPath?.startsWith("/dashboard") ? nextPath : "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!email.trim() || !password) {
        throw new Error("Informe email e senha.");
      }

      const supabase = getSupabaseClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          throw error;
        }

        router.replace(getDashboardRedirect(searchParams.get("next")));
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.replace("/dashboard");
        return;
      }

      setMessage("Conta criada. Confirme seu email antes de entrar.");
    } catch (error) {
      const friendlyMessage =
        error instanceof Error ? error.message : "Nao foi possivel autenticar.";
      setErrorMessage(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud px-5 text-ink">
      <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <Link href="/" className="text-xl font-black tracking-tight">
          AtendeAI
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-coral">
          {mode === "login" ? "Login" : "Cadastro"}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {mode === "login" ? "Entrar no painel" : "Criar conta"}
        </h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-ink/70">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink/70">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-md border border-ink/10 bg-cloud px-4 text-sm outline-none transition focus:border-moss focus:bg-white"
            />
          </label>
          {message && (
            <div className="rounded-md border border-moss/20 bg-mint px-4 py-3 text-sm font-semibold text-moss">
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold">
              {errorMessage}
            </div>
          )}
          <button
            disabled={isSubmitting}
            className="min-h-11 w-full rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/45"
          >
            {isSubmitting
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>
        <p className="mt-5 text-sm text-ink/60">
          {mode === "login" ? "Ainda nao tem conta? " : "Ja tem conta? "}
          <Link
            href={mode === "login" ? "/register" : "/login"}
            className="font-bold text-moss"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </Link>
        </p>
      </section>
    </main>
  );
}
