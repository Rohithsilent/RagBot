"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Menu, X, Paperclip, Sparkles, PanelLeftClose, PanelLeft } from "lucide-react";
import { useRagBackend } from "@/hooks/useRagBackend";
import { BackgroundWrapper } from "@/components/BackgroundWrapper";
import { UploadZone } from "@/components/UploadZone";
import { MessageBubble } from "@/components/MessageBubble";
import { QuickActions } from "@/components/QuickActions";
import { ThemeToggle } from "@/components/ThemeToggle";

export function ChatInterface() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);        // mobile overlay
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true); // desktop toggle
    const [isChatActive, setIsChatActive] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const { messages, isTyping, sendMessage } = useRagBackend();
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = (text: string) => {
        if (!text.trim()) return;
        setIsChatActive(true);
        sendMessage(text);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputValue);
        }
    };

    return (
        <BackgroundWrapper>
            <div className="flex flex-1 w-full overflow-hidden relative">

                {/* ═══ Mobile Sidebar Overlay ═══ */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                                className="fixed inset-0 dark:bg-black/60 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                                className="fixed top-0 left-0 h-full w-80 cosmic-glass-strong z-50 flex
                                    dark:border-r dark:border-white/[0.06]
                                    border-r border-black/[0.06]"
                            >
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-2 dark:text-slate-500 dark:hover:text-white text-slate-400 hover:text-slate-900
                                            transition-colors dark:bg-white/5 dark:hover:bg-white/10 bg-black/5 hover:bg-black/10 rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <UploadZone />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* ═══ Desktop Sidebar (collapsible) ═══ */}
                <motion.aside
                    initial={false}
                    animate={{
                        width: isSidebarCollapsed ? 0 : 320,
                        opacity: isSidebarCollapsed ? 0 : 1,
                    }}
                    transition={{ type: "spring", damping: 28, stiffness: 200 }}
                    className="hidden lg:flex relative flex-shrink-0 h-full cosmic-glass-strong z-30 overflow-hidden
                        dark:border-r dark:border-white/[0.06]
                        border-r border-black/[0.06]"
                >
                    <UploadZone />
                </motion.aside>

                {/* ═══ Main Content Area ═══ */}
                <main className="flex-1 flex flex-col relative w-full h-full overflow-hidden">

                    {/* Header Bar — always visible */}
                    <header className="relative top-0 left-0 right-0 h-14 flex items-center px-4 lg:px-6 z-20 shrink-0 transition-colors duration-500
                        dark:bg-black/20 dark:border-b dark:border-white/[0.04]
                        bg-white/30 border-b border-black/[0.04]
                        backdrop-blur-xl"
                    >
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10
                                text-slate-400 hover:text-slate-900 hover:bg-black/5 rounded-lg transition-all mr-2"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Desktop sidebar toggle */}
                        <button
                            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden lg:flex p-2 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10
                                text-slate-400 hover:text-slate-900 hover:bg-black/5 rounded-lg transition-all mr-3"
                            title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
                        >
                            {isSidebarCollapsed
                                ? <PanelLeft className="w-5 h-5" />
                                : <PanelLeftClose className="w-5 h-5" />
                            }
                        </button>

                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold tracking-wide dark:text-slate-300 text-slate-700">
                                Rag<span className="text-violet-400 dark:text-violet-400">Bot</span>
                            </span>
                        </div>

                        {/* Theme Toggle — right side */}
                        <div className="ml-auto">
                            <ThemeToggle />
                        </div>
                    </header>

                    {/* Flex Layout Container */}
                    <div className={`flex flex-col w-full mx-auto transition-all duration-700 ease-out ${isChatActive ? "flex-1 min-h-0 px-6 lg:px-12" : "h-full justify-center px-4 lg:px-8"}`}>

                        {/* ═══ Landing Hero ═══ */}
                        <AnimatePresence>
                            {!isChatActive && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95, overflow: "hidden" }}
                                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    className="flex flex-col items-center justify-center w-full mb-10 shrink-0"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1, duration: 0.6 }}
                                        className="mb-6"
                                    >
                                        <div className="w-16 h-16 rounded-2xl cosmic-glass flex items-center justify-center
                                            dark:border dark:border-white/[0.08]
                                            border border-black/[0.06]"
                                        >
                                            <Sparkles className="w-8 h-8 text-violet-400" />
                                        </div>
                                    </motion.div>

                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15, duration: 0.5 }}
                                        className="text-5xl md:text-7xl font-bold tracking-tight cosmic-title mb-4 text-center"
                                    >
                                        RagBot
                                    </motion.h1>

                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25, duration: 0.5 }}
                                        className="text-base md:text-lg dark:text-slate-500 text-slate-500 font-normal tracking-wide text-center max-w-md"
                                    >
                                        Your intelligent document companion — upload, ask, understand.
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ═══ Chat Messages Area ═══ */}
                        <AnimatePresence>
                            {isChatActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="flex-1 w-full overflow-hidden flex flex-col pt-4 min-h-0"
                                >
                                    <div className="flex-1 w-full pr-2 overflow-y-auto min-h-0 scroll-smooth">
                                        {messages.map((msg) => (
                                            <MessageBubble key={msg.id} message={msg} />
                                        ))}

                                        {/* Typing Indicator */}
                                        {isTyping && !messages.find(m => m.isStreaming) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex w-full justify-start mb-6"
                                            >
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-8 h-8 rounded-full cosmic-glass
                                                        dark:border dark:border-white/[0.08]
                                                        border border-black/[0.06]
                                                        flex items-center justify-center"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                                                    </div>
                                                    <div className="flex gap-1.5 px-4 py-3 cosmic-glass rounded-2xl">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={endOfMessagesRef} className="h-4" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ═══ Input Island ═══ */}
                        <motion.div
                            layout
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className={`w-full shrink-0 z-20 relative flex flex-col items-center ${!isChatActive ? "max-w-2xl mx-auto" : "pb-4"}`}
                        >
                            {/* Subtle divider above input when chat is active */}
                            {isChatActive && (
                                <div className="w-full h-px cosmic-divider mb-3" />
                            )}

                            <div className="relative w-full group">
                                {/* Glow layer — pulses when AI is thinking */}
                                <div className={`absolute -inset-[2px] rounded-2xl blur-xl transition-opacity duration-700 z-0
                                    dark:bg-gradient-to-r dark:from-violet-600/30 dark:via-indigo-500/20 dark:to-violet-600/30
                                    bg-gradient-to-r from-violet-400/20 via-indigo-400/15 to-violet-400/20
                                    ${isTyping ? "opacity-80 input-glow-pulse" : "opacity-0 group-hover:opacity-40"}`}
                                />

                                {/* Input container */}
                                <div className="relative z-10 cosmic-glass-panel rounded-2xl flex flex-col p-1.5 transition-all duration-300
                                    dark:focus-within:shadow-[0_8px_40px_rgba(139,92,246,0.3)] dark:focus-within:border-violet-500/50
                                    focus-within:shadow-[0_8px_40px_rgba(139,92,246,0.15)] focus-within:border-violet-400/40"
                                >
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask about your documents..."
                                        className="w-full bg-transparent border-none outline-none resize-none px-4 pt-3 pb-2 min-h-[52px] max-h-[160px] text-[0.98rem] leading-relaxed font-medium
                                            dark:text-slate-100 dark:placeholder:text-slate-500
                                            text-slate-800 placeholder:text-slate-400"
                                        rows={1}
                                    />

                                    <div className="flex items-center justify-between px-2 pb-1">
                                        <button
                                            onClick={() => {
                                                // On mobile open overlay, on desktop toggle sidebar
                                                if (window.innerWidth < 1024) {
                                                    setSidebarOpen(true);
                                                } else {
                                                    setSidebarCollapsed(false);
                                                }
                                            }}
                                            className="p-2 dark:text-slate-500 dark:hover:text-violet-300 dark:hover:bg-violet-500/10
                                                text-slate-400 hover:text-violet-500 hover:bg-violet-500/[0.06]
                                                rounded-lg transition-all duration-200"
                                            title="Attach documents"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleSend(inputValue)}
                                            disabled={!inputValue.trim() || isTyping}
                                            className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]
                                                disabled:from-white/[0.04] disabled:to-white/[0.02]
                                                dark:disabled:text-slate-600 disabled:text-slate-400
                                                disabled:shadow-none disabled:cursor-not-allowed
                                                transition-all duration-300 transform active:scale-95"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions (only on landing) */}
                            <AnimatePresence>
                                {!isChatActive && (
                                    <motion.div
                                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <QuickActions
                                            onActionClick={handleSend}
                                            onUploadClick={() => {
                                                if (window.innerWidth < 1024) {
                                                    setSidebarOpen(true);
                                                } else {
                                                    setSidebarCollapsed(false);
                                                }
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                    </div>
                </main>
            </div>
        </BackgroundWrapper>
    );
}
