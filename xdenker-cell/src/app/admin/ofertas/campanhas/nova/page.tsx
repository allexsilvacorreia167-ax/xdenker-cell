"use client";

import CampaignForm from "@/components/admin/CampaignForm";
import AdminHeader from "@/components/admin/AdminHeader";

export default function NovaCampanhaPage() {
    return (
        <div>
            <AdminHeader title="Nova Campanha" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                <CampaignForm />
            </div>
        </div>
    );
}