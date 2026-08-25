"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ServiceOrderForm, { ServiceOrderInitial } from "@/components/admin/ServiceOrderForm";
import AdminHeader from "@/components/admin/AdminHeader";

export default function EditarOsPage() {
    const params = useParams<{ id: string }>();
    const [initial, setInitial] = useState<ServiceOrderInitial | null>(null);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("service_orders").select("*").eq("id", params.id).single();
            if (!data) return;
            setInitial({
                id: data.id,
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone ?? "",
                equipment: data.equipment,
                device_password: data.device_password ?? "",
                reported_issue: data.reported_issue,
                technical_notes: data.technical_notes ?? "",
                budget_value: data.budget_value ? String(data.budget_value) : "",
                status: data.status,
                parts_used: data.parts_used ?? [],
            });
        }
        load();
    }, [params.id]);

    if (!initial) return <p className="text-gray-400 text-sm p-8">Carregando...</p>;

    return (
        <div>
            <AdminHeader title="Editar Ordem de Serviço" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                <ServiceOrderForm initial={initial} />
            </div>
        </div>
    );
}