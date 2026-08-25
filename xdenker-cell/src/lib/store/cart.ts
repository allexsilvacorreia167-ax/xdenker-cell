"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OpcaoFrete } from "@/services/freteService";

export type CartItem = {
    productId: string;
    slug: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    variant?: string;
};

type CartState = {
    items: CartItem[];
    // === Frete ===
    freteSelecionado: OpcaoFrete | null;
    cepFrete: string;
    setFrete: (opcao: OpcaoFrete | null, cep?: string) => void;
    limparFrete: () => void;

    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeItem: (productId: string, variant?: string) => void;
    updateQuantity: (productId: string, quantity: number, variant?: string) => void;
    clearCart: () => void;
    totalItems: () => number;
    subtotal: () => number;
    totalComFrete: () => number;
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            freteSelecionado: null,
            cepFrete: "",

            setFrete: (opcao, cep) =>
                set({
                    freteSelecionado: opcao,
                    cepFrete: cep ?? get().cepFrete,
                }),

            limparFrete: () => set({ freteSelecionado: null, cepFrete: "" }),

            addItem: (item, quantity = 1) => {
                set((state) => {
                    const existing = state.items.find(
                        (i) => i.productId === item.productId && i.variant === item.variant
                    );
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.productId === item.productId && i.variant === item.variant
                                    ? { ...i, quantity: i.quantity + quantity }
                                    : i
                            ),
                        };
                    }
                    return { items: [...state.items, { ...item, quantity }] };
                });
            },

            removeItem: (productId, variant) => {
                set((state) => ({
                    items: state.items.filter(
                        (i) => !(i.productId === productId && i.variant === variant)
                    ),
                }));
            },

            updateQuantity: (productId, quantity, variant) => {
                if (quantity < 1) {
                    get().removeItem(productId, variant);
                    return;
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.productId === productId && i.variant === variant
                            ? { ...i, quantity }
                            : i
                    ),
                }));
            },

            clearCart: () => set({ items: [], freteSelecionado: null, cepFrete: "" }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

            subtotal: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

            totalComFrete: () => {
                const sub = get().subtotal();
                const frete = get().freteSelecionado?.preco ?? 0;
                return sub + frete;
            },
        }),
        { name: "xdenker-cart" }
    )
);