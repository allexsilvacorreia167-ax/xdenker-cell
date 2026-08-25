"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReceiptByOrderId, getInvoiceSignedUrl, SaleReceipt } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import ReceiptDocument from "@/components/receipt/ReceiptDocument";
import AdminHeader from "@/components/admin/AdminHeader";
import { Upload, FileCheck, Download, Trash2 } from "lucide-react";

export default function AdminReciboPage() {
    const params = useParams<{ id: string }>();
    const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        const data = await getReceiptByOrderId(params.id);
        setReceipt(data);
        setInvoiceNumber(data?.official_invoice_number ?? "");

        if (data?.official_invoice_path) {
            const url = await getInvoiceSignedUrl(data.official_invoice_path);
            setInvoiceUrl(url);
        }

        const { data: order } = await supabase.from("orders").select("user_id").eq("id", params.id).single();
        if (order?.user_id) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", order.user_id)
                .single();
            setCustomerName(profile?.full_name || profile?.email || "");
        }

        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !receipt) return;

        if (file.type !== "application/pdf") {
            setError("Envie apenas arquivos PDF.");
            return;
        }

        setUploading(true);
        setError(null);

        const path = `${receipt.order_id}/nota-fiscal.pdf`;

        const { error: uploadError } = await supabase.storage.from("invoices").upload(path, file, {
            upsert: true,
            contentType: "application/pdf",
        });

        if (uploadError) {
            setError("Falha ao enviar: " + uploadError.message);
            setUploading(false);
            return;
        }

        await supabase
            .from("sale_receipts")
            .update({
                official_invoice_path: path,
                official_invoice_number: invoiceNumber || null,
                official_invoice_uploaded_at: new Date().toISOString(),
            })
            .eq("id", receipt.id);

        setUploading(false);
        e.target.value = "";
        load();
    }

    async function handleRemoveInvoice() {
        if (!receipt?.official_invoice_path) return;
        if (!confirm("Remover a nota fiscal oficial anexada? O cliente voltará a ver só o comprovante interno.")) return;

        await supabase.storage.from("invoices").remove([receipt.official_invoice_path]);
        await supabase
            .from("sale_receipts")
            .update({ official_invoice_path: null, official_invoice_number: null, official_invoice_uploaded_at: null })
            .eq("id", receipt.id);

        setInvoiceUrl(null);
        load();
    }

    return (
        <div>
            <AdminHeader title="Comprovante de Venda" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8 print:p-0">
                {loading ? (
                    <p className="text-sm text-gray-400">Carregando...</p>
                ) : !receipt ? (
                    <div className="glass rounded-2xl p-10 text-center text-gray-400 max-w-md">
                        Nenhum comprovante gerado ainda pra este pedido — ele só é criado quando o status vira &quot;Pagamento Confirmado&quot;.
                    </div>
                ) : (
                    <>
                        <div className="glass rounded-2xl p-5 mb-6 max-w-2xl mx-auto print:hidden">
                            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-cyan-400" />
                                Nota Fiscal Oficial (NF-e/NFC-e)
                            </h2>
                            <p className="text-xs text-gray-400 mb-4">
                                Se você já emitiu a nota fiscal de verdade fora do sistema, anexa o PDF aqui — ela passa a ser o
                                documento que o cliente vê no lugar do comprovante interno.
                            </p>

                            {receipt.official_invoice_path ? (
                                <div className="glass rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-emerald-400 font-medium">Nota fiscal anexada</div>
                                        {receipt.official_invoice_number && (
                                            <div className="text-xs text-gray-400">Nº {receipt.official_invoice_number}</div>
                                        )}
                                        {receipt.official_invoice_uploaded_at && (
                                            <div className="text-xs text-gray-500">
                                                Enviada em {new Date(receipt.official_invoice_uploaded_at).toLocaleDateString("pt-BR")}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {invoiceUrl && (
                                            <a
                                                href={invoiceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full glass flex items-center justify-center hover:border-cyan-400/50"
                                            >
                                                <Download className="w-4 h-4 text-cyan-400" />
                                            </a>
                                        )}
                                        <button
                                            onClick={handleRemoveInvoice}
                                            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:border-red-400/50"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Número da Nota Fiscal (opcional)</label>
                                        <input
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            placeholder="Ex: 000123"
                                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 font-mono"
                                        />
                                    </div>
                                    <label className="glass rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center py-6 cursor-pointer hover:border-cyan-400/50 transition">
                                        <Upload className="w-5 h-5 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-300">
                                            {uploading ? "Enviando..." : "Clique para anexar o PDF da nota fiscal"}
                                        </span>
                                        <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                                    </label>
                                </div>
                            )}
                            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                        </div>

                        <ReceiptDocument receipt={receipt} showTaxDetails={true} customerName={customerName} />
                    </>
                )}
            </div>
        </div>
    );
}