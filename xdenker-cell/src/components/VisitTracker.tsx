"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VisitTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith("/admin")) return;

        let sessionId = sessionStorage.getItem("xdenker-session-id");
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem("xdenker-session-id", sessionId);
        }

        // Só registra uma visita de sessão por navegação (não por render)
        supabase.from("site_visits").insert({ session_id: sessionId, page: pathname }).then();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null;
}