"use client";

import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, Mail } from "lucide-react";

const RESTRICTED_PASSWORD = "Axsilva167adm";
const OWNER_EMAIL = "allexsilvacorreia167@gmail.com";

export default function MasterGuard({ children }: { children: React.ReactNode }) {
    const [unlocked, setUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [showForgot, setShowForgot] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    function handleUnlock(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        setTimeout(() => {
            if (password === RESTRICTED_PASSWORD) {
                setUnlocked(true);
            } else {
                setError("Senha incorreta.");
            }
            setLoading(false);
        }, 400);
    }

    async function handleForgotPassword() {
        setSendingEmail(true);
        setError("");

        try {
            const res = await fetch("/api/admin/recover-master-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: OWNER_EMAIL }),
            });

            if (!res.ok) throw new Error("Falha ao enviar");
            setEmailSent(true);
        } catch {
            setError("Não foi possível enviar o e-mail. Tente novamente.");
        } finally {
            setSendingEmail(false);
        }
    }

    if (!unlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0f19]">
                <div className="glass-strong rounded-3xl p-8 w-full max-w-md border border-white/10">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-3">
                            <Lock className="w-6 h-6 text-amber-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Área Restrita</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Balanço Financeiro e Configurações Avançadas
                        </p>
                    </div>

                    {!showForgot ? (
                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Senha de acesso</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50 pr-10"
                                        placeholder="Digite a senha"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
                            >
                                {loading ? "Verificando..." : "Desbloquear"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgot(true);
                                    setError("");
                                    setEmailSent(false);
                                }}
                                className="w-full text-xs text-cyan-400 hover:underline mt-2"
                            >
                                Esqueci a senha
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {!emailSent ? (
                                <>
                                    <p className="text-sm text-gray-300 text-center">
                                        Enviaremos a senha de acesso para o e-mail do proprietário:
                                    </p>
                                    <p className="text-sm text-cyan-400 text-center font-medium">{OWNER_EMAIL}</p>

                                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                                    <button
                                        onClick={handleForgotPassword}
                                        disabled={sendingEmail}
                                        className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {sendingEmail ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Mail className="w-4 h-4" />
                                        )}
                                        {sendingEmail ? "Enviando..." : "Enviar senha por e-mail"}
                                    </button>
                                </>
                            ) : (
                                <div className="text-center space-y-3">
                                    <p className="text-sm text-emerald-400">E-mail enviado com sucesso!</p>
                                    <p className="text-xs text-gray-400">
                                        Verifique a caixa de entrada (e o spam) de {OWNER_EMAIL}.
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgot(false);
                                    setError("");
                                }}
                                className="w-full text-xs text-gray-400 hover:text-white mt-2"
                            >
                                ← Voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}