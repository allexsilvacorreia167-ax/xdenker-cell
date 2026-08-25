import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { getCampaignBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";
import CountdownTimer from "@/components/promo/CountdownTimer";
import CampaignOfferClient from "@/components/promo/CampaignOfferClient";
import { Truck, CreditCard, ShieldCheck } from "lucide-react";

export default async function CampanhaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = await getCampaignBySlug(slug);

    if (!result) notFound();
    const { campaign, leftItems, kit } = result;

    const perks = [campaign.perk_1, campaign.perk_2, campaign.perk_3].filter(Boolean);
    const perkIcons = [CreditCard, Truck, ShieldCheck];

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-6xl mx-auto">
                <div className="glass-strong rounded-3xl p-6 lg:p-10">
                    <div className="text-center mb-6">
                        {campaign.brand_label && (
                            <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">{campaign.brand_label}</div>
                        )}
                        <h1 className="text-2xl lg:text-4xl font-bold text-white">
                            {campaign.title_line1} <span className="text-cyan-400">{campaign.title_line2}</span>
                        </h1>
                    </div>

                    {perks.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 text-xs lg:text-sm text-gray-300">
                            {perks.map((perk, i) => {
                                const Icon = perkIcons[i] ?? ShieldCheck;
                                return (
                                    <span key={i} className="flex items-center gap-1.5">
                                        <Icon className="w-4 h-4 text-cyan-400" />
                                        {perk}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {campaign.expires_at && (
                        <div className="flex justify-center mb-8">
                            <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
                                <span className="text-xs text-gray-400">Termina em:</span>
                                <CountdownTimer expiresAt={campaign.expires_at} />
                            </div>
                        </div>
                    )}

                    <CampaignOfferClient
                        leftItems={leftItems}
                        kit={kit}
                        campaignTitle={`${campaign.title_line1} ${campaign.title_line2}`}
                    />
                </div>
            </main>
            <BottomNav />
        </>
    );
}