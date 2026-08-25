"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RecuperarSenhaPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/redefinir-senha`,
        });

        setLoading(false);

        if (error) {
            setError("Não foi possível enviar o e-mail. Tente novamente.");
            return;
        }
        setSent(true);
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass-strong rounded-3xl p-8 w-full max-w-md text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-xl mb-4">
                    X
                </div>

                {sent ? (
                    <>
                        <h1 className="text-lg font-bold mb-2">Verifique seu e-mail</h1>
                        <p className="text-sm text-gray-400 mb-6">
                            Enviamos um link para redefinir sua senha para <span className="text-white">{email}</span>.
                        </p>
                        <Link href="/login" className="glow-btn w-full py-3 rounded-full font-semibold text-sm inline-block">
                            Voltar para o Login
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="text-lg font-bold mb-1">Esqueceu sua senha?</h1>
                        <p className="text-sm text-gray-400 mb-6">
                            Digite seu e-mail e enviaremos um link para redefinir sua senha.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
                            >
                                {loading ? "Enviando..." : "Enviar Link"}
                            </button>
                        </form>
                        <Link href="/login" className="text-xs text-cyan-400 hover:underline mt-4 inline-block">
                            Voltar para o Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}