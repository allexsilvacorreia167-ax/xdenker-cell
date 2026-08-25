"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RedefinirSenhaPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (password.length < 6) {
            setError("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        setLoading(true);
        // O Supabase já cria a sessão de recuperação a partir do link do e-mail
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setError("Não foi possível redefinir a senha. Peça um novo link.");
            return;
        }

        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass-strong rounded-3xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-xl mb-3">
                        X
                    </div>
                    <h1 className="text-xl font-bold">Nova Senha</h1>
                </div>

                {success ? (
                    <p className="text-sm text-emerald-400 text-center">
                        Senha redefinida! Redirecionando para o login...
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Nova Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                placeholder="••••••••"
                            />
                        </div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
                        >
                            {loading ? "Salvando..." : "Salvar Nova Senha"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}