"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductImageCarousel({ images, name }: { images: string[]; name: string }) {
    const [index, setIndex] = useState(0);
    const list = images.length > 0 ? images : [];

    function next() {
        setIndex((i) => (i + 1) % list.length);
    }
    function prev() {
        setIndex((i) => (i - 1 + list.length) % list.length);
    }

    if (list.length === 0) {
        return (
            <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-slate-600 to-slate-900 border border-white/10 flex items-center justify-center">
                <div className="w-1/2 h-2/3 rounded-lg bg-white/5" />
            </div>
        );
    }

    return (
        <div>
            <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-slate-600 to-slate-900 border border-white/10 overflow-hidden glass-strong">
                {list.map((img, i) => (
                    <div
                        key={img}
                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`${name} - imagem ${i + 1}`} className="w-full h-full object-contain" />
                    </div>
                ))}

                {list.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            aria-label="Imagem anterior"
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full glass flex items-center justify-center hover:border-cyan-400/50 transition backdrop-blur-md"
                        >
                            <ChevronLeft className="w-4 h-4 text-cyan-300" />
                        </button>
                        <button
                            onClick={next}
                            aria-label="Próxima imagem"
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full glass flex items-center justify-center hover:border-cyan-400/50 transition backdrop-blur-md"
                        >
                            <ChevronRight className="w-4 h-4 text-cyan-300" />
                        </button>

                        <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-2">
                            {list.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    aria-label={`Ir para imagem ${i + 1}`}
                                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-cyan-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {list.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                    {list.map((img, i) => (
                        <button
                            key={img}
                            onClick={() => setIndex(i)}
                            className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === index ? "border-cyan-400" : "border-white/10 opacity-60 hover:opacity-100"
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}