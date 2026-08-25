"use client";

import { useEffect, useState } from "react";

function getRemaining(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
    };
}

export default function CountdownTimer({ expiresAt }: { expiresAt: string }) {
    const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));

    useEffect(() => {
        const timer = setInterval(() => setRemaining(getRemaining(expiresAt)), 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    if (!remaining) {
        return <span className="text-red-400 text-xs font-semibold">Oferta encerrada</span>;
    }

    return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            {remaining.days > 0 && <span>{remaining.days}d</span>}
            <span>{String(remaining.hours).padStart(2, "0")}h</span>
            <span>{String(remaining.minutes).padStart(2, "0")}m</span>
            <span>{String(remaining.seconds).padStart(2, "0")}s</span>
        </div>
    );
}