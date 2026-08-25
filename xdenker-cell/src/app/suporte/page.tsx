"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ChatWidget from "@/components/chat/ChatWidget";
import { supabase } from "@/lib/supabase";
import { ChevronDown, MessageCircle } from "lucide-react";

const faqs = [
    { question: "Como rastrear meu pedido?", answer: "Acesse 'Meus Pedidos' na sua conta para ver o status e o código de rastreio." },
    { question: "Prazos de garantia de celulares e notebooks?", answer: "Celulares e notebooks têm garantia de 12 meses direto com a XDENKER CELL." },
    { question: "Como solicitar assistência técnica?", answer: "Abra um chamado pelo chat ao vivo ou WhatsApp informando o número do pedido." },
    { question: "Formas de pagamento aceitas?", answer: "Cartão de crédito, PIX e boleto bancário." },
];

type Ticket = { id: string; title: string; status: string };

export default function SuportePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        async function loadTickets() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setLoggedIn(false);
                setLoadingTickets(false);
                return;
            }
            setLoggedIn(true);
            const { data, error } = await supabase
                .from("support_tickets")
                .select("id, title, status")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (!error && data) setTickets(data as Ticket[]);
            setLoadingTickets(false);
        }
        loadTickets();
    }, []);

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Central de Suporte</h1>

                <div className="grid lg:grid-cols-3 gap-5">
                    <div className="glass rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">FAQ</h2>
                        <div className="space-y-2">
                            {faqs.map((faq, i) => (
                                <div key={i} className="glass rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left"
                                    >
                                        {faq.question}
                                        <ChevronDown
                                            className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {openFaq === i && <div className="px-4 pb-3 text-xs text-gray-400">{faq.answer}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-5 flex flex-col items-center text-center">
                        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Atendimento Direto</h2>
                        <button
                            onClick={() => setChatOpen(true)}
                            className="glow-btn w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mb-3"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Chat ao Vivo
                        </button>
                        <a
                            href="https://wa.me/5585900000000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 mb-4 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366]"
                        >
                            WhatsApp XDENKER
                        </a>
                        <a href="mailto:suporte@xdenker.com" className="text-xs text-cyan-400 hover:underline">
                            Enviar E-mail
                        </a>
                    </div>

                    <div className="glass rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                            Meus Chamados {loggedIn ? "(Logado)" : ""}
                        </h2>
                        {loadingTickets ? (
                            <p className="text-xs text-gray-500">Carregando...</p>
                        ) : !loggedIn ? (
                            <div className="text-sm text-gray-400">Faça login para acompanhar seus chamados de assistência técnica.</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-sm text-gray-400">Você ainda não tem chamados abertos.</div>
                        ) : (
                            <div className="space-y-2">
                                {tickets.map((t) => (
                                    <div key={t.id} className="glass rounded-xl px-4 py-3 text-sm">
                                        {t.title} — <span className="text-emerald-400">{t.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <BottomNav />
            {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
        </>
    );
}