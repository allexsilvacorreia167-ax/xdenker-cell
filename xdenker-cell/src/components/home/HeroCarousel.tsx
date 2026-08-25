"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
    image: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
};

const slides: Slide[] = [
    {
        image: "/home/banners/banner-1.jpg",
        title: "Novos iPhones chegaram",
        subtitle: "Titânio, câmera Pro e performance de outro nível",
        ctaText: "Descubra Ofertas",
        ctaHref: "/ofertas",
    },
    {
        image: "/home/banners/banner-2.jpg",
        title: "PCs Gamer Xdenker Custom",
        subtitle: "Montagem sob medida, RGB e potência máxima",
        ctaText: "Ver Computadores",
        ctaHref: "/computadores?cat=gaming",
    },
    {
        image: "/home/banners/banner-3.jpg",
        title: "MacBooks com condições especiais",
        subtitle: "Leveza, autonomia e desempenho Apple Silicon",
        ctaText: "Ver MacBooks",
        ctaHref: "/computadores?cat=macbook",
    },
    {
        image: "/home/banners/banner-4.jpg",
        title: "Acessórios de Áudio Premium",
        subtitle: "Fones e headphones com qualidade de estúdio",
        ctaText: "Ver Acessórios",
        ctaHref: "/acessorios?cat=audio",
    },
    {
        image: "/home/banners/banner-5.jpg",
        title: "Capas e Películas Protetoras",
        subtitle: "Proteção premium pro seu aparelho novo",
        ctaText: "Ver Capas",
        ctaHref: "/acessorios?cat=capas",
    },
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
    const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), []);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(next, AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [paused, next]);

    return (
        <div
            className="relative rounded-3xl overflow-hidden glass-strong"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative h-[260px] sm:h-[340px] lg:h-[420px]">
                {slides.map((slide, i) => (
                    <div
                        key={slide.image}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                        <div className="absolute inset-0 flex flex-col justify-end lg:justify-center px-6 sm:px-10 lg:px-14 pb-10 lg:pb-0">
                            <div className="max-w-md">
                                <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-2 lg:mb-3">
                                    {slide.title}
                                </h2>
                                <p className="text-sm lg:text-base text-gray-300 mb-4 lg:mb-6">{slide.subtitle}</p>
                                <Link
                                    href={slide.ctaHref}
                                    className="glow-btn inline-block px-6 py-3 rounded-full text-sm font-semibold"
                                >
                                    {slide.ctaText}
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={prev}
                aria-label="Anterior"
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass items-center justify-center hover:border-cyan-400/50 transition backdrop-blur-md"
            >
                <ChevronLeft className="w-5 h-5 text-cyan-300" />
            </button>
            <button
                onClick={next}
                aria-label="Próximo"
                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass items-center justify-center hover:border-cyan-400/50 transition backdrop-blur-md"
            >
                <ChevronRight className="w-5 h-5 text-cyan-300" />
            </button>

            <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Ir para o slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-cyan-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}