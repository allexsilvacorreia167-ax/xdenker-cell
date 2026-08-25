"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { getAdminSession, AdminRole } from "@/lib/adminAuth";

export default function MasterGuard({ children }: { children: React.ReactNode }) {
    const [checking, setChecking] = useState(true);
    const [role, setRole] = useState<AdminRole>("staff");

    useEffect(() => {
        getAdminSession().then((session) => {
            setRole(session?.role ?? "staff");
            setChecking(false);
        });
    }, []);

    if (checking) {
        return <p className="text-gray-400 text-sm p-6">Verificando permissão...</p>;
    }

    if (role !== "master") {
        return (
            <div className="p-6 lg:p-8">
                <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-amber-400" />
                    </div>
                    <h2 className="text-white font-semibold mb-2">Acesso Restrito</h2>
                    <p className="text-sm text-gray-400">
                        Esta área é exclusiva para administradores com nível <strong>Master</strong>. Fale com o
                        responsável pela conta se precisar de acesso.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}