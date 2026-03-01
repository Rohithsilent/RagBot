"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className="w-9 h-9 rounded-xl dark:bg-white/[0.05] bg-black/[0.05]" />
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <motion.button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            whileTap={{ scale: 0.85 }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center
                dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:border-white/[0.08]
                bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.06]
                border backdrop-blur-lg transition-colors duration-300
                dark:shadow-[0_0_12px_rgba(139,92,246,0.08)]
                shadow-[0_0_12px_rgba(0,0,0,0.04)]
                group cursor-pointer"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 18,
                        }}
                    >
                        <Moon className="w-4 h-4 text-violet-300 group-hover:text-violet-200 transition-colors" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 18,
                        }}
                    >
                        <Sun className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glow ring on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]
                shadow-[0_0_20px_rgba(245,158,11,0.2)]
                pointer-events-none"
            />
        </motion.button>
    );
}
