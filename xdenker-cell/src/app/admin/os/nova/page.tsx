"use client";

import ServiceOrderForm from "@/components/admin/ServiceOrderForm";
import AdminHeader from "@/components/admin/AdminHeader";

export default function NovaOsPage() {
    return (
        <div>
            <AdminHeader title="Nova Ordem de Serviço" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                <ServiceOrderForm />
            </div>
        </div>
    );
}