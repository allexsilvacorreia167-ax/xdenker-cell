"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, Loader2 } from "lucide-react";
import { buscarEnderecoPorCep, formatarCep } from "@/services/cepService";

export type Address = {
    id: string;
    label: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    isDefault: boolean;
};

export const emptyAddress = (): Address => ({
    id: crypto.randomUUID(),
    label: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    isDefault: false,
});

const fields: { key: keyof Address; label: string }[] = [
    { key: "label", label: "Apelido (ex: Casa, Trabalho)" },
    { key: "cep", label: "CEP" },
    { key: "street", label: "Rua / Avenida" },
    { key: "number", label: "Número" },
    { key: "complement", label: "Complemento" },
    { key: "neighborhood", label: "Bairro" },
    { key: "city", label: "Cidade" },
    { key: "state", label: "Estado" },
];

export default function AddressBook({
    addresses,
    onChange,
    selectable = false,
    selectedId,
    onSelect,
}: {
    addresses: Address[];
    onChange: (addresses: Address[]) => void;
    selectable?: boolean;
    selectedId?: string | null;
    onSelect?: (id: string) => void;
}) {
    const [editingId, setEditingId] = useState<string | null>(
        addresses.length === 0 ? "new" : null
    );
    const [draft, setDraft] = useState<Address>(emptyAddress());
    const [loadingCep, setLoadingCep] = useState(false);

    function startNew() {
        setDraft(emptyAddress());
        setEditingId("new");
    }

    function startEdit(address: Address) {
        setDraft(address);
        setEditingId(address.id);
    }

    function saveDraft() {
        if (!draft.street || !draft.city) return;
        const exists = addresses.some((a) => a.id === draft.id);
        let next = exists
            ? addresses.map((a) => (a.id === draft.id ? draft : a))
            : [...addresses, draft];

        if (draft.isDefault) {
            next = next.map((a) => ({ ...a, isDefault: a.id === draft.id }));
        }
        if (next.length === 1) {
            next = next.map((a) => ({ ...a, isDefault: true }));
        }

        onChange(next);
        if (selectable && onSelect) onSelect(draft.id);
        setEditingId(null);
    }

    function removeAddress(id: string) {
        const next = addresses.filter((a) => a.id !== id);
        if (next.length > 0 && !next.some((a) => a.isDefault)) {
            next[0] = { ...next[0], isDefault: true };
        }
        onChange(next);
    }

    function setDefault(id: string) {
        onChange(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    }

    // === Auto-preenchimento via ViaCEP ===
    async function handleCepChange(value: string) {
        const formatted = formatarCep(value);
        setDraft((prev) => ({ ...prev, cep: formatted }));

        const onlyNumbers = value.replace(/\D/g, "");
        if (onlyNumbers.length === 8) {
            setLoadingCep(true);
            try {
                const data = await buscarEnderecoPorCep(onlyNumbers);
                if (data) {
                    setDraft((prev) => ({
                        ...prev,
                        street: data.logradouro || prev.street,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state,
                        complement: data.complemento || prev.complement,
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCep(false);
            }
        }
    }

    return (
        <div className="space-y-3">
            {addresses.map((addr) =>
                editingId === addr.id ? (
                    <AddressForm
                        key={addr.id}
                        draft={draft}
                        setDraft={setDraft}
                        onSave={saveDraft}
                        onCancel={() => setEditingId(null)}
                        onCepChange={handleCepChange}
                        loadingCep={loadingCep}
                    />
                ) : (
                    <div
                        key={addr.id}
                        onClick={() => selectable && onSelect?.(addr.id)}
                        className={`glass rounded-xl p-4 flex items-start justify-between gap-3 ${selectable ? "cursor-pointer" : ""
                            } ${selectable && selectedId === addr.id ? "border-blue-400/60 bg-blue-500/5" : ""}`}
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            {selectable && (
                                <div
                                    className={`w-4 h-4 rounded-full border mt-0.5 flex-shrink-0 ${selectedId === addr.id ? "bg-blue-500 border-blue-400" : "border-gray-500"
                                        }`}
                                />
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold truncate">{addr.label || "Endereço"}</span>
                                    {addr.isDefault && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                            Padrão
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">
                                    {addr.street}, {addr.number}
                                    {addr.complement ? ` - ${addr.complement}` : ""} — {addr.neighborhood}, {addr.city} -{" "}
                                    {addr.state}, {addr.cep}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {!addr.isDefault && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDefault(addr.id);
                                    }}
                                    title="Definir como padrão"
                                    className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-blue-400/50"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(addr);
                                }}
                                className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-blue-400/50"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeAddress(addr.id);
                                }}
                                className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-red-400/50 text-red-400"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )
            )}

            {editingId === "new" ? (
                <AddressForm
                    draft={draft}
                    setDraft={setDraft}
                    onSave={saveDraft}
                    onCancel={() => setEditingId(null)}
                    onCepChange={handleCepChange}
                    loadingCep={loadingCep}
                />
            ) : (
                <button
                    type="button"
                    onClick={startNew}
                    className="w-full glass rounded-xl py-3 text-sm font-medium text-cyan-400 flex items-center justify-center gap-2 border border-cyan-400/20"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Endereço
                </button>
            )}
        </div>
    );
}

function AddressForm({
    draft,
    setDraft,
    onSave,
    onCancel,
    onCepChange,
    loadingCep,
}: {
    draft: Address;
    setDraft: (a: Address) => void;
    onSave: () => void;
    onCancel: () => void;
    onCepChange: (value: string) => void;
    loadingCep: boolean;
}) {
    return (
        <div className="glass rounded-xl p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
                {fields.map((f) => (
                    <div key={f.key} className={f.key === "label" ? "sm:col-span-2" : ""}>
                        <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                        <div className="relative">
                            <input
                                value={draft[f.key] as string}
                                onChange={(e) =>
                                    f.key === "cep"
                                        ? onCepChange(e.target.value)
                                        : setDraft({ ...draft, [f.key]: e.target.value })
                                }
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 transition"
                                maxLength={f.key === "cep" ? 9 : undefined}
                            />
                            {f.key === "cep" && loadingCep && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-cyan-400" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                    type="checkbox"
                    checked={draft.isDefault}
                    onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
                    className="accent-blue-500"
                />
                Definir como endereço padrão
            </label>
            <div className="flex gap-2 pt-1">
                <button type="button" onClick={onSave} className="glow-btn flex-1 py-2.5 rounded-full text-xs font-semibold">
                    Salvar Endereço
                </button>
                <button type="button" onClick={onCancel} className="glass px-4 py-2.5 rounded-full text-xs font-semibold">
                    Cancelar
                </button>
            </div>
        </div>
    );
}