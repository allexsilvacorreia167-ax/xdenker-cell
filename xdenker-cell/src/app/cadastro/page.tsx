"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AddressBook, { Address } from "@/components/ui/AddressBook";

export default function CadastroPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [showCpf, setShowCpf] = useState(true);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsConfirmation, setNeedsConfirmation] = useState(false);

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
        if (addresses.length === 0) {
            setError("Adicione pelo menos um endereço de entrega.");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    cpf,
                    phone,
                    addresses,
                },
            },
        });

        setLoading(false);

        if (error) {
            setError(
                error.message.includes("already registered")
                    ? "Esse e-mail já está cadastrado."
                    : "Não foi possível criar sua conta. Tente novamente."
            );
            return;
        }

        if (data.session) {
            router.push("/conta");
            router.refresh();
        } else {
            setNeedsConfirmation(true);
        }
    }

    if (needsConfirmation) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="glass-strong rounded-3xl p-8 w-full max-w-md text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-xl mb-4">
                        X
                    </div>
                    <h1 className="text-lg font-bold mb-2">Quase lá!</h1>
                    <p className="text-sm text-gray-400 mb-6">
                        Enviamos um link de confirmação para <span className="text-white">{email}</span>. Confirme seu
                        e-mail para poder entrar.
                    </p>
                    <Link href="/login" className="glow-btn w-full py-3 rounded-full font-semibold text-sm inline-block">
                        Ir para o Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="glass-strong rounded-3xl p-8 w-full max-w-xl">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-xl mb-3">
                        X
                    </div>
                    <h1 className="text-xl font-bold">XDENKER CELL</h1>
                    <p className="text-gray-400 text-sm mt-1">Criar Conta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h2 className="text-sm font-semibold mb-3 text-gray-300">Suas Informações</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-400 mb-1 block">Nome Completo</label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">CPF</label>
                                <div className="relative">
                                    <input
                                        type={showCpf ? "text" : "password"}
                                        required
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value)}
                                        className="w-full glass rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-blue-400/50 transition"
                                        placeholder="000.000.000-00"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCpf((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                                        tabIndex={-1}
                                    >
                                        {showCpf ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">E-mail</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-400 mb-1 block">Telefone / WhatsApp</label>
                                <input
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold mb-3 text-gray-300">Endereços de Entrega</h2>
                        <AddressBook addresses={addresses} onChange={setAddresses} />
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold mb-3 text-gray-300">Senha</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Senha</label>
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
                                <label className="text-xs text-gray-400 mb-1 block">Confirmar Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="glow-btn w-full py-3 rounded-full font-semibold text-sm disabled:opacity-50"
                    >
                        {loading ? "Criando..." : "Criar Conta"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Já tem cadastro?{" "}
                    <Link href="/login" className="text-cyan-400 hover:underline">
                        Fazer Login
                    </Link>
                </p>
            </div>
        </div>
    );
}