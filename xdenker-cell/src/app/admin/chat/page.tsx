"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, X, MessageSquare, Wrench, ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";

type Message = {
    id: string;
    user_id: string;
    sender: "user" | "admin";
    message: string;
    created_at: string;
    read_by_admin: boolean;
};

type Profile = { id: string; email: string; full_name: string };

type CustomerLink = {
    href: string;
    label: string;
    icon: "os" | "order";
};

type Conversation = {
    userId: string;
    profile?: Profile;
    lastMessage: string;
    lastAt: string;
    unread: number;
    customerLink: CustomerLink | null;
};

export default function AdminChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeTabs, setActiveTabs] = useState<string[]>([]);
    const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
    const [textsMap, setTextsMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const bottomRefs = useRef<Record<string, HTMLDivElement | null>>({});

    async function resolveCustomerLink(userId: string, email: string | undefined): Promise<CustomerLink | null> {
        const [{ data: lastOrder }, { data: lastOs }] = await Promise.all([
            supabase
                .from("orders")
                .select("id, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            email
                ? supabase
                    .from("service_orders")
                    .select("id, created_at")
                    .eq("customer_email", email.toLowerCase())
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
        ]);

        const orderDate = lastOrder ? new Date(lastOrder.created_at).getTime() : 0;
        const osDate = lastOs ? new Date(lastOs.created_at).getTime() : 0;

        if (!lastOrder && !lastOs) return null;

        if (osDate >= orderDate) {
            return { href: `/admin/os/${lastOs!.id}`, label: "Ver OS", icon: "os" };
        }
        return { href: `/admin/vendas/${lastOrder!.id}`, label: "Ver Pedido", icon: "order" };
    }

    async function loadConversations() {
        const { data: allMessages } = await supabase
            .from("chat_messages")
            .select("*")
            .order("created_at", { ascending: false });

        const list = (allMessages as Message[]) ?? [];
        const byUser = new Map<string, Message[]>();
        list.forEach((m) => {
            const arr = byUser.get(m.user_id) ?? [];
            arr.push(m);
            byUser.set(m.user_id, arr);
        });

        const userIds = Array.from(byUser.keys());
        const profileMap: Record<string, Profile> = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .in("id", userIds);
            (profiles as Profile[] | null)?.forEach((p) => (profileMap[p.id] = p));
        }

        const convosBase = userIds.map((userId) => {
            const msgs = byUser.get(userId)!;
            const last = msgs[0];
            const unread = msgs.filter((m) => m.sender === "user" && !m.read_by_admin).length;
            return { userId, profile: profileMap[userId], lastMessage: last.message, lastAt: last.created_at, unread };
        });

        const convos: Conversation[] = await Promise.all(
            convosBase.map(async (c) => ({
                ...c,
                customerLink: await resolveCustomerLink(c.userId, c.profile?.email),
            }))
        );

        convos.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
        setConversations(convos);
        setLoading(false);
    }

    async function loadThread(userId: string) {
        const { data } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        setMessagesMap((prev) => ({ ...prev, [userId]: (data as Message[]) ?? [] }));

        await supabase.from("chat_messages").update({ read_by_admin: true }).eq("user_id", userId).eq("sender", "user");
        loadConversations();
    }

    useEffect(() => {
        loadConversations();

        const channel = supabase
            .channel("admin-chat-all")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
                const newMsg = payload.new as Message;
                setMessagesMap((prev) => {
                    if (!prev[newMsg.user_id]) return prev;
                    return {
                        ...prev,
                        [newMsg.user_id]: [...prev[newMsg.user_id], newMsg],
                    };
                });
                loadConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    function openConversation(userId: string) {
        if (!activeTabs.includes(userId)) {
            setActiveTabs((prev) => [...prev, userId]);
        }
        if (!messagesMap[userId]) {
            loadThread(userId);
        }
    }

    function closeTab(userId: string, e: React.MouseEvent) {
        e.stopPropagation();
        setActiveTabs((prev) => prev.filter((id) => id !== userId));
    }

    async function handleSend(userId: string, e: React.FormEvent) {
        e.preventDefault();
        const text = textsMap[userId]?.trim();
        if (!text) return;

        setTextsMap((prev) => ({ ...prev, [userId]: "" }));

        await supabase.from("chat_messages").insert({ user_id: userId, sender: "admin", message: text });

        setMessagesMap((prev) => ({
            ...prev,
            [userId]: [
                ...(prev[userId] || []),
                {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    sender: "admin",
                    message: text,
                    created_at: new Date().toISOString(),
                    read_by_admin: true,
                },
            ],
        }));
        loadConversations();
    }

    return (
        <div className="h-[calc(100vh-2rem)] w-full flex gap-3 p-2 overflow-x-auto overflow-y-hidden">
            {/* 1. Coluna Fixa Esquerda: Lista de todas as conversas */}
            <div className="w-80 flex-shrink-0 bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>Todas as Conversas</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {loading ? (
                        <p className="text-xs text-gray-500 p-4">Carregando...</p>
                    ) : conversations.length === 0 ? (
                        <p className="text-xs text-gray-500 p-4">Nenhuma conversa ainda.</p>
                    ) : (
                        conversations.map((c) => {
                            const isOpen = activeTabs.includes(c.userId);
                            const name = c.profile?.full_name?.trim() || c.profile?.email || "Cliente sem perfil";
                            return (
                                <button
                                    key={c.userId}
                                    onClick={() => openConversation(c.userId)}
                                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition flex flex-col gap-1 cursor-pointer ${isOpen ? "bg-blue-500/10 border-l-2 border-blue-500" : ""
                                        }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm font-medium truncate text-white">{name}</span>
                                        {c.unread > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-blue-500 text-[10px] flex items-center justify-center font-bold flex-shrink-0 text-white">
                                                {c.unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 2. Área Direita: Painéis de conversas abertas */}
            <div className="flex gap-3 h-full items-start overflow-x-auto">
                {activeTabs.map((userId) => {
                    const convo = conversations.find((c) => c.userId === userId);
                    const name = convo?.profile?.full_name?.trim() || convo?.profile?.email || "Cliente sem perfil";
                    const messages = messagesMap[userId] || [];
                    const link = convo?.customerLink ?? null;

                    return (
                        <div
                            key={userId}
                            className="w-80 h-full flex-shrink-0 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-xl"
                        >
                            {/* Cabeçalho da caixa com navegação interna para OS ou Pedido */}
                            <div className="px-4 py-3 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate max-w-[210px]">
                                    <span className="text-xs font-semibold text-white truncate" title={name}>
                                        {name}
                                    </span>
                                    {link ? (
                                        <Link
                                            href={link.href}
                                            className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-2 py-0.5 rounded-full transition flex-shrink-0 cursor-pointer"
                                            title={link.label}
                                        >
                                            {link.icon === "os" ? <Wrench className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                                            <span>{link.label}</span>
                                            <ChevronRight className="w-2.5 h-2.5 opacity-70" />
                                        </Link>
                                    ) : (
                                        <span className="text-[10px] text-gray-500 italic">Sem registros</span>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => closeTab(userId, e)}
                                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
                                    title="Fechar aba"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Histórico de mensagens */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${m.sender === "admin"
                                                ? "bg-blue-600 text-white rounded-br-sm"
                                                : "bg-white/10 text-gray-200 rounded-bl-sm"
                                                }`}
                                        >
                                            {m.message}
                                        </div>
                                    </div>
                                ))}
                                <div
                                    ref={(el) => {
                                        bottomRefs.current[userId] = el;
                                    }}
                                />
                            </div>

                            {/* Input de envio */}
                            <form
                                onSubmit={(e) => handleSend(userId, e)}
                                className="flex items-center gap-2 p-2.5 border-t border-white/5 bg-slate-900/50"
                            >
                                <input
                                    value={textsMap[userId] || ""}
                                    onChange={(e) =>
                                        setTextsMap((prev) => ({ ...prev, [userId]: e.target.value }))
                                    }
                                    placeholder="Responder..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs text-white outline-none focus:border-blue-400/50"
                                />
                                <button
                                    type="submit"
                                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center flex-shrink-0 text-white cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}