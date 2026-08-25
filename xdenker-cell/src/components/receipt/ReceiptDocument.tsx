"use client";

import { SaleReceipt } from "@/lib/queries";
import { Printer } from "lucide-react";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const paymentLabels: Record<string, string> = {
    pix: "PIX",
    cartao: "Cartão de Crédito",
    credito: "Cartão de Crédito",
    debito: "Cartão de Débito",
    boleto: "Boleto Bancário",
    dinheiro: "Dinheiro",
};

export default function ReceiptDocument({
    receipt,
    showTaxDetails,
    customerName,
}: {
    receipt: SaleReceipt;
    showTaxDetails: boolean;
    customerName?: string;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-end mb-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="glow-btn px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                    <Printer className="w-4 h-4" />
                    Baixar / Imprimir PDF
                </button>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-8 print:rounded-none print:p-0 shadow-xl print:shadow-none">
                <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
                                X
                            </div>
                            <div>
                                <div className="font-bold text-sm">XDENKER CELL</div>
                                <div className="text-[10px] text-gray-500">Comprovante de Venda</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Comprovante Nº</div>
                        <div className="text-sm font-mono font-semibold">{receipt.receipt_number}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {new Date(receipt.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>
                </div>

                {customerName && (
                    <div className="mb-6">
                        <div className="text-xs text-gray-500 mb-0.5">Cliente</div>
                        <div className="text-sm font-medium">{customerName}</div>
                    </div>
                )}

                <table className="w-full text-sm mb-6">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                            <th className="pb-2">Produto</th>
                            <th className="pb-2 text-center">Qtd</th>
                            <th className="pb-2 text-right">Unitário</th>
                            <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-2.5">{item.name}</td>
                                <td className="py-2.5 text-center">{item.quantity}</td>
                                <td className="py-2.5 text-right">{formatPrice(item.price)}</td>
                                <td className="py-2.5 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="border-t border-gray-200 pt-4 space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(receipt.subtotal)}</span>
                    </div>

                    {showTaxDetails && (
                        <>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Regime Tributário</span>
                                <span>{receipt.tax_regime}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Impostos embutidos ({receipt.tax_rate}%)</span>
                                <span>{formatPrice(receipt.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Taxa do gateway ({receipt.gateway_fee_rate}%)</span>
                                <span>{formatPrice(receipt.gateway_fee_amount)}</span>
                            </div>
                        </>
                    )}

                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
                        <span>Total Pago</span>
                        <span>{formatPrice(receipt.total)}</span>
                    </div>

                    {receipt.payment_method && (
                        <div className="flex justify-between text-sm text-gray-600 pt-1">
                            <span>Forma de pagamento</span>
                            <span>{paymentLabels[receipt.payment_method] ?? receipt.payment_method}</span>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-gray-400 mt-8 pt-4 border-t border-gray-100">
                    Este é um comprovante interno de venda, não substitui nota fiscal eletrônica.
                    {showTaxDetails && " Valores de impostos exibidos apenas para conferência administrativa."}
                </p>
            </div>
        </div>
    );
}