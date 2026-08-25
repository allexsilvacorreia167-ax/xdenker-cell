"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import AddressBook, { Address } from "@/components/ui/AddressBook";
import { useCartStore } from "@/lib/store/cart";
import { calcularFrete, type OpcaoFrete } from "@/services/freteService";
import { Loader2 } from "lucide-react";

type PersonalInfo = { name: string; cpf: string; email: string; phone: string };

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CheckoutInfoPage() {
    const router = useRouter();
    const { freteSelecionado, setFrete, subtotal, totalComFrete } = useCartStore();

    const [personal, setPersonal] = useState<PersonalInfo>({
        name: "",
        cpf: "",
        email: "",
        phone: "",
    });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [carregandoFrete, setCarregandoFrete] = useState(false);
    const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([]);

    // Carrega perfil do usuário
    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            try {
                // 1. Pega a sessão atual
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    if (mounted) setLoadingProfile(false);
                    return;
                }

                // 2. Força atualização dos dados do usuário
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error || !user || !mounted) {
                    setLoadingProfile(false);
                    return;
                }

                setLoggedIn(true);
                const meta = user.user_metadata ?? {};

                console.log("=== METADATA COMPLETA ===", meta);
                console.log("=== ENDEREÇOS ===", meta.addresses);

                setPersonal({
                    name: (meta.full_name as string) || "",
                    cpf: (meta.cpf as string) || "",
                    email: user.email || "",
                    phone: (meta.phone as string) || "",
                });

                const savedAddresses = Array.isArray(meta.addresses) ? (meta.addresses as Address[]) : [];
                setAddresses(savedAddresses);

                const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || null;
                setSelectedId(defaultAddr?.id ?? null);

                if (defaultAddr?.cep) {
                    calcularFreteAutomatico(defaultAddr.cep);
                }
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
            } finally {
                if (mounted) setLoadingProfile(false);
            }
        }

        loadProfile();

        // Escuta mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadProfile();
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Quando o usuário troca de endereço, recalcula o frete
    useEffect(() => {
        if (!selectedId) return;
        const addr = addresses.find((a) => a.id === selectedId);
        if (addr?.cep) {
            calcularFreteAutomatico(addr.cep);
        }
    }, [selectedId]);

    async function calcularFreteAutomatico(cep: string) {
        setCarregandoFrete(true);
        try {
            const resultado = await calcularFrete(cep, subtotal());
            if (resultado.sucesso) {
                setOpcoesFrete(resultado.opcoes);

                // Mantém a opção anterior se ainda existir, senão pega a primeira
                if (freteSelecionado) {
                    const aindaExiste = resultado.opcoes.find((o) => o.id === freteSelecionado.id);
                    if (aindaExiste) {
                        setFrete(aindaExiste, cep);
                    } else {
                        setFrete(resultado.opcoes[0], cep);
                    }
                } else if (resultado.opcoes.length > 0) {
                    setFrete(resultado.opcoes[0], cep);
                }
            }
        } catch (err) {
            console.error("Erro ao calcular frete:", err);
        } finally {
            setCarregandoFrete(false);
        }
    }

    function updatePersonal(field: keyof PersonalInfo, value: string) {
        setPersonal((p) => ({ ...p, [field]: value }));
    }

    function handleLogin() {
        router.push("/login?redirect=/checkout");
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const chosenAddress = addresses.find((a) => a.id === selectedId);
        if (!chosenAddress) {
            alert("Selecione ou adicione um endereço de entrega.");
            return;
        }
        if (!freteSelecionado) {
            alert("Selecione uma opção de frete.");
            return;
        }

        sessionStorage.setItem(
            "xdenker-checkout-info",
            JSON.stringify({
                ...personal,
                ...chosenAddress,
                frete: freteSelecionado,
            })
        );
        router.push("/checkout/pagamento");
    }

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-2xl mx-auto">
                <h1 className="text-xl font-bold mb-6 text-center">Informações Pessoais e Envio</h1>

                {!loadingProfile && !loggedIn && (
                    <div className="glass rounded-2xl p-5 mb-5 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold mb-0.5">Painel de Boas-Vindas</div>
                            <div className="text-xs text-gray-400">
                                Já é cadastrado? Faça login para preencher automaticamente.
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogin}
                            className="glass px-4 py-2 rounded-full text-xs font-semibold border border-cyan-400/30 flex-shrink-0"
                        >
                            Fazer Login
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Dados pessoais */}
                    <div className="glass rounded-2xl p-5">
                        <h2 className="text-sm font-semibold mb-4">Suas Informações</h2>
                        <div className="space-y-3">
                            {(
                                [
                                    { key: "name", label: "Nome Completo" },
                                    { key: "cpf", label: "CPF" },
                                    { key: "email", label: "E-mail" },
                                    { key: "phone", label: "Telefone / WhatsApp" },
                                ] as { key: keyof PersonalInfo; label: string }[]
                            ).map((f) => (
                                <div key={f.key}>
                                    <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                                    <input
                                        required
                                        value={personal[f.key]}
                                        onChange={(e) => updatePersonal(f.key, e.target.value)}
                                        className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="glass rounded-2xl p-5">
                        <h2 className="text-sm font-semibold mb-4">Endereço de Entrega</h2>
                        <AddressBook
                            addresses={addresses}
                            onChange={setAddresses}
                            selectable
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                    </div>

                    {/* Opções de Frete */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold">Opções de Frete</h2>
                            {carregandoFrete && (
                                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            )}
                        </div>

                        {opcoesFrete.length === 0 && !carregandoFrete && (
                            <p className="text-xs text-gray-400">
                                Selecione um endereço para calcular o frete.
                            </p>
                        )}

                        <div className="space-y-2">
                            {opcoesFrete.map((opcao) => (
                                <label
                                    key={opcao.id}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition ${freteSelecionado?.id === opcao.id
                                        ? "border-cyan-400/60 bg-cyan-500/10"
                                        : "border-white/10 hover:border-white/20"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="frete"
                                            checked={freteSelecionado?.id === opcao.id}
                                            onChange={() => setFrete(opcao)}
                                            className="accent-cyan-400"
                                        />
                                        <div>
                                            <div className="text-sm font-medium">{opcao.nome}</div>
                                            <div className="text-xs text-gray-400">{opcao.prazo}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-cyan-400">
                                        {opcao.gratis || opcao.preco === 0
                                            ? "Grátis"
                                            : formatPrice(opcao.preco)}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Resumo rápido */}
                    {freteSelecionado && (
                        <div className="glass rounded-2xl p-4 flex justify-between text-sm">
                            <span className="text-gray-300">Total com frete</span>
                            <span className="font-bold text-cyan-400">
                                {formatPrice(totalComFrete())}
                            </span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="glow-btn w-full py-3 rounded-full text-sm font-semibold"
                    >
                        Salvar e Continuar para Pagamento
                    </button>
                </form>
            </main>
            <BottomNav />
        </>
    );
}