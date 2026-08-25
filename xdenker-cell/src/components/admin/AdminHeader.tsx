"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { NotificationBell } from "@/components/admin/NotificationBell";

const rangeOptions = [
    { value: 7, label: "Últimos 7 dias" },
    { value: 30, label: "Últimos 30 dias" },
    { value: 90, label: "Últimos 90 dias" },
];

export default function AdminHeader({
    title,
    range,
    onRangeChange,
    adminEmail,
}: {
    title: string;
    range: number;
    onRangeChange: (days: number) => void;
    adminEmail?: string | null;
}) {
    const [rangeOpen, setRangeOpen] = useState(false);

    return (
        <div className="flex flex-wrap items-center gap-3 px-6 lg:px-8 py-5 border-b border-white/5">
            <h1 className="text-2xl font-bold text-white mr-auto">{title}</h1>

            <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    placeholder="Buscar no painel..."
                    className="w-full glass rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400/50 transition"
                />
            </div>

            <div className="relative">
                <button
                    onClick={() => setRangeOpen((v) => !v)}
                    className="glass rounded-full px-4 py-2.5 text-xs font-medium flex items-center gap-2"
                >
                    {rangeOptions.find((r) => r.value === range)?.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {rangeOpen && (
                    <div className="absolute right-0 mt-2 glass-strong rounded-xl overflow-hidden z-10 w-44">
                        {rangeOptions.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => {
                                    onRangeChange(r.value);
                                    setRangeOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 ${range === r.value ? "text-blue-300" : "text-gray-300"
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Sininho integrado com Supabase Realtime */}
            <NotificationBell />

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-sm flex-shrink-0" title={adminEmail ?? ""}>
                {adminEmail?.[0]?.toUpperCase() ?? "A"}
            </div>
        </div>
    );
}