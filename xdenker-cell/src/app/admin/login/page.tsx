"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Recuperação
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !data.user) {
            setLoading(false);
            setError("E-mail ou senha incorretos.");
            return;
        }

        const { data: adminRow } = await supabase
            .from("admin_users")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();

        if (!adminRow) {
            await supabase.auth.signOut();
            setLoading(false);
            setError("Essa conta não tem acesso ao painel administrativo.");
            return;
        }

        setLoading(false);
        router.push("/admin");
        router.refresh();
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setResetLoading(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            resetEmail,
            {
                redirectTo: `${window.location.origin}/admin/redefinir-senha`,
            }
        );

        setResetLoading(false);

        if (resetError) {
            setError("Não foi possível enviar o e-mail de recuperação.");
            return;
        }

        setResetSent(true);
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
            <div className="glass-strong rounded-3xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center font-bold text-xl mb-3">
                        X
                    </div>
                    <h1 className="text-xl font-bold">XDENKER CELL</h1>
                    <p className="text-gray-400 text-sm mt-1">Painel Administrativo</p>
                </div>

                {!showForgot ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">E-mail admin</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
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
                            />
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
                        >
                            {loading ? "Entrando..." : "Entrar no Painel"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForgot(true);
                                setError(null);
                                setResetSent(false);
                                setResetEmail(email);
                            }}
                            className="w-full text-xs text-cyan-400 hover:underline"
                        >
                            Esqueci a senha
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        {!resetSent ? (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <p className="text-sm text-gray-300 text-center">
                                    Digite o e-mail do admin para receber o link de redefinição.
                                </p>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50"
                                    />
                                </div>

                                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {resetLoading ? "Enviando..." : "Enviar link de recuperação"}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center space-y-2">
                                <p className="text-sm text-emerald-400">E-mail enviado!</p>
                                <p className="text-xs text-gray-400">
                                    Verifique a caixa de entrada e o spam.
                                </p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setShowForgot(false);
                                setError(null);
                            }}
                            className="w-full text-xs text-gray-400 hover:text-white"
                        >
                            ← Voltar ao login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}