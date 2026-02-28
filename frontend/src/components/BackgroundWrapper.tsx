"use client";

import { ReactNode } from "react";
import Image from "next/image";

export function BackgroundWrapper({ children }: { children: ReactNode }) {
    return (
        <div className="relative h-[100dvh] bg-[#030308] text-slate-100 overflow-hidden font-sans selection:bg-violet-500/30 grain-overlay">
            {/* Deep Space Nebula Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/nebula-bg.png"
                    alt=""
                    fill
                    priority
                    className="object-cover opacity-30 mix-blend-screen pointer-events-none"
                    sizes="100vw"
                    quality={85}
                />
            </div>

            {/* Midnight-to-Obsidian Gradient Overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: `linear-gradient(
                        180deg,
                        rgba(3, 3, 8, 0.7) 0%,
                        rgba(3, 3, 8, 0.4) 40%,
                        rgba(3, 3, 8, 0.2) 70%,
                        rgba(3, 3, 8, 0.5) 100%
                    )`,
                }}
            />

            {/* Horizon Glow — Deep Indigo/Violet Radial */}
            <div className="horizon-glow" />

            {/* Content wrapper */}
            <main className="relative z-10 h-full flex flex-col">
                {children}
            </main>
        </div>
    );
}
