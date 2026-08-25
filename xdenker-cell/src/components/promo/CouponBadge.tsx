"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Coupon = {
    code: string;
    title: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    expires_at: string | null;
};

export default function CouponBadge({ coupon }: { coupon: Coupon }) {
    const [copied, setCopied] = useState(false);

    function copyCode() {
        navigator.clipboard.writeText(coupon.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const label =
        coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `R$${coupon.discount_value}`;

    return (
        <button
            onClick={copyCode}
            className="relative flex flex-col items-center justify-center w-36 h-36 flex-shrink-0 group"
        >
            {/* Selo circular estilo carimbo */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 p-[3px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-[#0b0f19] border-2 border-dashed border-cyan-400/40 flex flex-col items-center justify-center px-2">
                    <span className="text-xl font-extrabold text-white leading-none">{label}</span>
                    <span className="text-[10px] text-cyan-300 uppercase tracking-wide mt-1">OFF</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-1.5 truncate max-w-[80px]">{coupon.code}</span>
                </div>
            </div>

            {/* "dentes" de selo nas bordas (efeito ticket) */}
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                boxShadow: "0 0 0 0 transparent",
                backgroundImage: "radial-gradient(circle, transparent 68%, transparent 70%)",
            }} />

            <div className="absolute -bottom-1 flex items-center gap-1 bg-[#0b0f19] px-2 py-0.5 rounded-full border border-white/10">
                {copied ? (
                    <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copiado!</span>
                    </>
                ) : (
                    <>
                        <Copy className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-400">Copiar</span>
                    </>
                )}
            </div>

            {coupon.expires_at && (
                <span className="text-[10px] text-gray-500 mt-2 text-center">
                    Até {new Date(coupon.expires_at).toLocaleDateString("pt-BR")}
                </span>
            )}
        </button>
    );
}