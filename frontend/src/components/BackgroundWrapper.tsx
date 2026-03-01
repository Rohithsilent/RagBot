"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export function BackgroundWrapper({ children }: { children: ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = !mounted || resolvedTheme === "dark";

    return (
        <div className={`relative h-[100dvh] overflow-clip font-sans grain-overlay transition-colors duration-700
            ${isDark
                ? "bg-[#030308] text-slate-100 selection:bg-violet-500/30"
                : "bg-[#f5f0f0] text-slate-900 selection:bg-violet-500/20"
            }`}
        >
            {/* ═══ Dark Mode: Deep Space Nebula ═══ */}
            <AnimatePresence>
                {isDark && (
                    <motion.div
                        key="dark-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0"
                    >
                        <Image
                            src="/nebula-bg.png"
                            alt=""
                            fill
                            priority
                            className="object-cover opacity-30 mix-blend-screen pointer-events-none"
                            sizes="100vw"
                            quality={85}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Light Mode: Ethereal Dawn Gradient ═══ */}
            <AnimatePresence>
                {!isDark && (
                    <motion.div
                        key="light-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            background: `
                                radial-gradient(ellipse at 20% 0%, rgba(232, 210, 255, 0.4) 0%, transparent 50%),
                                radial-gradient(ellipse at 80% 10%, rgba(186, 220, 255, 0.35) 0%, transparent 50%),
                                radial-gradient(ellipse at 50% 80%, rgba(255, 218, 185, 0.25) 0%, transparent 50%),
                                linear-gradient(180deg,
                                    #f8f4f8 0%,
                                    #f0ebf5 30%,
                                    #eae5f2 60%,
                                    #f2ece8 100%
                                )
                            `,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ═══ Dark Mode: Gradient Overlay ═══ */}
            <AnimatePresence>
                {isDark && (
                    <motion.div
                        key="dark-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
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
                )}
            </AnimatePresence>

            {/* Horizon Glow — adapts via CSS */}
            <div className="horizon-glow" />

            {/* Content wrapper */}
            <main className="relative z-10 h-full flex flex-col">
                {children}
            </main>
        </div>
    );
}
