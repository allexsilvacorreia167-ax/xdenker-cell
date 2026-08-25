"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Message = {
    id: string;
    user_id: string;
    sender: "user" | "admin";
    message: string;
    created_at: string;
};

export default function ChatWidget({ onClose }: { onClose: () => void }) {
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
            setLoadingAuth(false);
        });
    }, []);

    useEffect(() => {
        if (!userId) return;

        async function loadMessages() {
            const { data } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: true });
            setMessages((data as Message[]) ?? []);

            await supabase
                .from("chat_messages")
                .update({ read_by_user: true })
                .eq("user_id", userId)
                .eq("sender", "admin");
        }
        loadMessages();

        const channel = supabase
            .channel(`chat-${userId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${userId}` },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim() || !userId) return;
        const content = text.trim();
        setText("");
        await supabase.from("chat_messages").insert({ user_id: userId, sender: "user", message: content });
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end bg-black/40 sm:bg-transparent p-0 sm:p-6">
            <div className="glass-strong w-full sm:w-96 h-[85vh] sm:h-[560px] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-sm font-semibold">Chat ao Vivo — XDENKER CELL</div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loadingAuth ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Carregando...</div>
                ) : !userId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
                        <p className="text-sm text-gray-400">Faça login para conversar com nosso suporte.</p>
                        <a href="/login?redirect=/suporte" className="glow-btn px-5 py-2.5 rounded-full text-xs font-semibold">
                            Fazer Login
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                            {messages.length === 0 && (
                                <p className="text-xs text-gray-500 text-center mt-6">
                                    Envie sua primeira mensagem, nosso time responde em breve.
                                </p>
                            )}
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.sender === "user"
                                            ? "bg-blue-500/30 text-white rounded-br-sm"
                                            : "glass text-gray-200 rounded-bl-sm"
                                            }`}
                                    >
                                        {m.message}
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-white/10">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 glass rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                            <button
                                type="submit"
                                className="w-10 h-10 rounded-full glow-btn flex items-center justify-center flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}