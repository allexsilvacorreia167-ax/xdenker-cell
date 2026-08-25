"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import { getReceiptByOrderId, getInvoiceSignedUrl, SaleReceipt } from "@/lib/queries";
import ReceiptDocument from "@/components/receipt/ReceiptDocument";
import { FileCheck, Download } from "lucide-react";

export default function ClienteReciboPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function load() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            setCustomerName((user.user_metadata?.full_name as string) || user.email || "");

            const data = await getReceiptByOrderId(params.id);
            if (!data) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setReceipt(data);

            if (data.official_invoice_path) {
                const url = await getInvoiceSignedUrl(data.official_invoice_path);
                setInvoiceUrl(url);
            }

            setLoading(false);
        }
        load();
    }, [params.id, router]);

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 print:p-0">
                {loading ? (
                    <p className="text-sm text-gray-400 text-center">Carregando...</p>
                ) : notFound || !receipt ? (
                    <div className="glass rounded-2xl p-10 text-center text-gray-400 max-w-md mx-auto">
                        Comprovante ainda não disponível para este pedido. Ele é gerado automaticamente assim que o pagamento é confirmado.
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        {invoiceUrl && (
                            <div className="glass rounded-2xl p-5 mb-4 flex items-center justify-between print:hidden">
                                <div className="flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <div className="text-sm font-medium text-white">Nota Fiscal Oficial disponível</div>
                                        {receipt.official_invoice_number && (
                                            <div className="text-xs text-gray-400">Nº {receipt.official_invoice_number}</div>
                                        )}
                                    </div>
                                </div>
                                <a
                                    href={invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glow-btn px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Baixar Nota Fiscal
                                </a>
                            </div>
                        )}

                        <ReceiptDocument receipt={receipt} showTaxDetails={false} customerName={customerName} />
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}