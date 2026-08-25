"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/conta");
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente."
      );
      return;
    }

    router.push("/conta");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-gray-400 text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-xl mb-3">
            X
          </div>
          <h1 className="text-xl font-bold">XDENKER CELL</h1>
          <p className="text-gray-400 text-sm mt-1">Login do Cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
              placeholder="••••••••"
            />
          </div>
          <div className="text-right">
            <Link href="/recuperar-senha" className="text-xs text-cyan-400 hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Ainda não tem cadastro?{" "}
          <Link href="/cadastro" className="text-cyan-400 hover:underline">
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
}