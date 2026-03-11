"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Menu, X, Paperclip, Sparkles, PanelLeftClose, PanelLeft, ArrowUp, Loader2 } from "lucide-react";
import { useRagBackend, type ChatMessage, type HistoryEntry } from "@/hooks/useRagBackend";
import { useFirebase } from "@/components/FirebaseProvider";
import { useChatSessions } from "@/hooks/useChatSessions";
import { BackgroundWrapper } from "@/components/BackgroundWrapper";
import { UploadZone } from "@/components/UploadZone";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { SessionSidebar } from "@/components/SessionSidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { QuickActions } from "@/components/QuickActions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function ChatInterface() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);        // mobile overlay
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true); // desktop toggle
    const [isChatActive, setIsChatActive] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const { user, setShowAuthModal } = useFirebase();
    const { messages, setMessages, isTyping, sendMessage, handleFileUpload, fetchUserDocuments, deleteDocument } = useRagBackend(user?.uid);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const {
        sessions,
        activeSessionId,
        setActiveSessionId,
        sessionMessages,
        createSession,
        addMessage,
        deleteSession,
        startNewChat,
    } = useChatSessions();

    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const activeSessionRef = useRef<string | null>(null);

    // Track the active session id in a ref for use in async callbacks
    useEffect(() => {
        activeSessionRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // ─── Load messages from Firestore when switching sessions ───
    useEffect(() => {
        if (sessionMessages.length > 0) {
            const hydrated: ChatMessage[] = sessionMessages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                sources: m.sources,
            }));
            setMessages(hydrated);
            setIsChatActive(true);
        } else if (activeSessionId === null) {
            // New chat — clear everything
            setMessages([]);
            setIsChatActive(false);
        }
    }, [sessionMessages, activeSessionId, setMessages]);

    // ─── Build conversation history from current messages ───────
    const buildHistory = useCallback((): HistoryEntry[] => {
        return messages
            .filter((m) => !m.isStreaming && m.content.trim().length > 0)
            .map((m) => ({
                role: m.role === "user" ? "user" as const : "assistant" as const,
                content: m.content,
            }));
    }, [messages]);

    // ─── Auth-gated send ────────────────────────────────────────
    const handleSend = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Auth gate
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        setIsChatActive(true);
        setInputValue("");

        // Build history BEFORE adding the new message to state
        const history = buildHistory();

        // Session management: create if needed
        let sid = activeSessionRef.current;
        if (!sid) {
            sid = await createSession(text);
            if (!sid) return;
        }

        // Send via RAG backend with conversation history
        const result = await sendMessage(text, history);

        // Persist both messages to Firestore after streaming completes
        if (sid) {
            await addMessage(sid, { role: "user", content: text });
            if (result) {
                await addMessage(sid, {
                    role: "ai",
                    content: result.answer,
                    sources: result.sources,
                });
            }
        }
    }, [user, setShowAuthModal, buildHistory, createSession, sendMessage, addMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputValue);
        }
    };

    const handleInputFocus = () => {
        if (!user) {
            setShowAuthModal(true);
        }
    };

    // ─── Session actions ────────────────────────────────────────
    const handleSelectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        setSidebarOpen(false); // close mobile overlay on selection
    };

    const handleNewChat = () => {
        startNewChat();
        setMessages([]);
        setIsChatActive(false);
    };

    const handleDeleteSession = async (sessionId: string) => {
        await deleteSession(sessionId);
        if (activeSessionId === sessionId) {
            setMessages([]);
            setIsChatActive(false);
        }
    };

    // ─── Sidebar content (shared between mobile & desktop) ─────
    const sidebarContent = (
        <div className="flex flex-col h-full overflow-hidden">
            {user ? (
                <SessionSidebar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                    onDeleteSession={handleDeleteSession}
                >
                    <UploadZone
                        onFileUpload={handleFileUpload}
                        onUploadComplete={() => setRefreshTrigger((t) => t + 1)}
                    />
                    <DocumentLibrary
                        userId={user?.uid}
                        fetchUserDocuments={fetchUserDocuments}
                        deleteDocument={deleteDocument}
                        refreshTrigger={refreshTrigger}
                    />
                </SessionSidebar>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Auth-gated UploadZone for unauthenticated users */}
                    <div onClick={() => setShowAuthModal(true)}>
                        <div className="pointer-events-none opacity-60">
                            <UploadZone onFileUpload={handleFileUpload} />
                        </div>
                    </div>
                    <p className="text-center text-xs dark:text-slate-500 text-slate-400 px-4 mt-2">
                        Sign in to upload documents
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <BackgroundWrapper>
            <div className="flex flex-1 w-full h-[100dvh] overflow-hidden relative">

                {/* ═══ Mobile Sidebar Overlay ═══ */}
                <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 border-r-0 cosmic-glass-strong dark:bg-black/40 bg-white/40">
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <div className="flex-1 min-h-0 pt-12 h-full">
                            {sidebarContent}
                        </div>
                    </SheetContent>
                </Sheet>

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
                    <div className="w-80 h-full">
                        {sidebarContent}
                    </div>
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

                        {/* Right side — Theme Toggle only (user profile moved to sidebar) */}
                        <div className="ml-auto flex items-center gap-2">
                            <ThemeToggle />
                        </div>
                    </header>

                    {/* Flex Layout Container */}
                    <div className={`flex flex-col w-full mx-auto transition-all duration-700 ease-out ${isChatActive ? "flex-1 min-h-0 px-3 sm:px-6 lg:px-12" : "h-full justify-center px-4 lg:px-8"}`}>

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
                            className={`w-full shrink-0 z-20 relative flex flex-col items-center ${!isChatActive ? "max-w-2xl mx-auto pb-[env(safe-area-inset-bottom)] sm:pb-4" : "pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4"}`}
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
                                <div className="relative z-10 flex items-center pr-1 pl-1 py-1 transition-all duration-300 rounded-[28px] border
                                    dark:bg-white/[0.04] dark:border-white/10 dark:focus-within:border-white/20 dark:focus-within:bg-white/[0.06]
                                    bg-black/[0.02] border-black/10 focus-within:border-black/20 focus-within:bg-white
                                    backdrop-blur-xl shadow-sm"
                                >
                                    <button
                                        onClick={() => {
                                            // On mobile open overlay, on desktop toggle sidebar
                                            if (window.innerWidth < 1024) {
                                                setSidebarOpen(true);
                                            } else {
                                                setSidebarCollapsed(false);
                                            }
                                        }}
                                        className="p-2.5 ml-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-full transition-colors shrink-0"
                                        title="Attach documents"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>

                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onFocus={handleInputFocus}
                                        placeholder="Ask about your documents..."
                                        className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-3.5 min-h-[50px] max-h-[160px] text-[0.98rem] leading-relaxed font-medium focus:ring-0
                                            dark:text-slate-100 dark:placeholder:text-slate-500
                                            text-slate-800 placeholder:text-slate-400"
                                        rows={1}
                                    />

                                    <motion.button
                                        onClick={() => handleSend(inputValue)}
                                        disabled={!inputValue.trim() || isTyping}
                                        animate={{
                                            scale: 1,
                                            opacity: 1
                                        }}
                                        whileHover={(!inputValue.trim() || isTyping) ? {} : { scale: 1.05 }}
                                        whileTap={(!inputValue.trim() || isTyping) ? {} : { scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-full mr-1.5 transition-colors duration-300
                                            ${(!inputValue.trim() || isTyping)
                                                ? "bg-black/5 dark:bg-neutral-700/50 text-black/30 dark:text-neutral-500"
                                                : "bg-black dark:bg-white text-white dark:text-black"
                                            }`}
                                    >
                                        {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" strokeWidth={2.5} />}
                                    </motion.button>
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
