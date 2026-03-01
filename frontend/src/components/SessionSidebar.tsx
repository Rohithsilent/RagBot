"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MessageSquare,
    Trash2,
    Settings,
    LogOut,
    ChevronUp,
} from "lucide-react";
import type { SessionMeta } from "@/hooks/useChatSessions";
import { useFirebase } from "@/components/FirebaseProvider";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

interface SessionSidebarProps {
    sessions: SessionMeta[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
    children?: React.ReactNode;
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SessionSidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    children,
}: SessionSidebarProps) {
    const { user, signOut } = useFirebase();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const initial = user?.displayName
        ? user.displayName.charAt(0).toUpperCase()
        : user?.email
            ? user.email.charAt(0).toUpperCase()
            : "U";

    const photoURL = user?.photoURL;

    return (
        <div className="flex flex-col h-full">
            {/* ═══ Top: New Chat Button ═══ */}
            <div className="px-3 pt-3 pb-1 shrink-0">
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300
                        dark:bg-white/[0.06] dark:hover:bg-white/[0.10] dark:text-slate-200 dark:border-white/[0.06]
                        bg-black/[0.04] hover:bg-black/[0.07] text-slate-700 border-black/[0.05]
                        border active:scale-[0.98]
                        hover:shadow-[0_0_16px_rgba(139,92,246,0.12)]"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
            </div>

            {/* ═══ Middle: Scrollable Chat History ═══ */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
                {sessions.length > 0 && (
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest dark:text-slate-500 text-slate-400 px-2 mb-2">
                        Your chats
                    </p>
                )}

                <div className="flex flex-col gap-0.5">
                    <AnimatePresence initial={false}>
                        {sessions.map((session) => {
                            const isActive = session.id === activeSessionId;
                            return (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => onSelectSession(session.id)}
                                    className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative
                                        ${isActive
                                            ? "dark:bg-white/[0.08] dark:text-white bg-black/[0.06] text-slate-900"
                                            : "dark:hover:bg-white/[0.04] dark:text-slate-300 hover:bg-black/[0.03] text-slate-700"
                                        }`}
                                >
                                    <MessageSquare
                                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive
                                            ? "text-violet-400"
                                            : "dark:text-slate-500 text-slate-400"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[0.8rem] font-medium truncate">
                                            {session.title}
                                        </p>
                                        <p className="text-[0.6rem] dark:text-slate-600 text-slate-400 mt-0.5">
                                            {formatRelativeTime(session.updatedAt)}
                                        </p>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200
                                            dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10
                                            text-slate-400 hover:text-red-500 hover:bg-red-500/[0.06]"
                                        title="Delete session"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {sessions.length === 0 && (
                        <p className="text-center text-xs dark:text-slate-600 text-slate-400 py-8 font-medium">
                            No conversations yet
                        </p>
                    )}
                </div>

                {/* Extra content (e.g. UploadZone) */}
                {children && (
                    <div className="mt-2">
                        {children}
                    </div>
                )}
            </div>

            {/* ═══ Bottom: User Profile Bar ═══ */}
            {user && (
                <div ref={menuRef} className="relative shrink-0 px-3 pb-3 pt-1">
                    {/* Divider */}
                    <div className="h-px cosmic-divider mb-2" />

                    {/* User popover menu — opens upward */}
                    <AnimatePresence>
                        {userMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl overflow-hidden z-50
                                    auth-glass
                                    dark:auth-glow-dark auth-glow-light"
                            >
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setShowSettings(true);
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                            dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white
                                            text-slate-700 hover:bg-black/[0.04] hover:text-slate-900"
                                    >
                                        <Settings className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                                        Profile Settings
                                    </button>

                                    <button
                                        onClick={async () => {
                                            setUserMenuOpen(false);
                                            await signOut();
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                            dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400
                                            text-slate-700 hover:bg-red-500/[0.06] hover:text-red-500"
                                    >
                                        <LogOut className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* User bar trigger */}
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200
                            dark:hover:bg-white/[0.06] hover:bg-black/[0.04]
                            group"
                    >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-transparent
                            group-hover:ring-violet-500/20 transition-all duration-300">
                            {photoURL ? (
                                <img
                                    src={photoURL}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold
                                    bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                                    {initial}
                                </div>
                            )}
                        </div>

                        {/* Name / Email */}
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-[0.8rem] font-semibold dark:text-slate-200 text-slate-800 truncate">
                                {user.displayName || user.email?.split("@")[0] || "User"}
                            </p>
                            {user.displayName && user.email && (
                                <p className="text-[0.6rem] dark:text-slate-500 text-slate-400 truncate">
                                    {user.email}
                                </p>
                            )}
                        </div>

                        {/* Chevron */}
                        <ChevronUp className={`w-4 h-4 dark:text-slate-500 text-slate-400 transition-transform duration-200 shrink-0
                            ${userMenuOpen ? "rotate-0" : "rotate-180"}`}
                        />
                    </button>
                </div>
            )}

            <ProfileSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
}
