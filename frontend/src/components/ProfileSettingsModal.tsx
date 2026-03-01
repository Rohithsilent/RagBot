"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Settings,
    Download,
    Trash2,
    UserX,
    AlertCircle,
    ChevronLeft
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { useChatSessions } from "@/hooks/useChatSessions";

interface ProfileSettingsModalProps {
    open: boolean;
    onClose: () => void;
}

type ViewState = "main" | "confirm-clear" | "confirm-delete";

export function ProfileSettingsModal({ open, onClose }: ProfileSettingsModalProps) {
    const { user, deleteAccount } = useFirebase();
    const { deleteAllSessions, exportAllSessions } = useChatSessions();

    const [view, setView] = useState<ViewState>("main");
    const [isExporting, setIsExporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    // Reset view when modal closes
    React.useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setView("main");
                setError("");
            }, 300);
        }
    }, [open]);

    if (!user) return null;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportAllSessions();
        } catch (err: unknown) {
            console.error(err);
            setError("Failed to export data.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearChats = async () => {
        setIsClearing(true);
        try {
            await deleteAllSessions();
            setView("main");
            onClose();
        } catch (err: unknown) {
            console.error(err);
            setError("Failed to clear chats.");
        } finally {
            setIsClearing(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAllSessions(); // Clean up data first
            await deleteAccount();
            onClose();
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to delete account.";
            if (message.includes("requires-recent-login")) {
                setError("Please sign out and sign in again before deleting your account for security reasons.");
            } else {
                setError("Failed to delete account. You may need to sign in again.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                    >
                        <div
                            className="relative w-full max-w-md overflow-hidden rounded-3xl
                                auth-glass dark:auth-glow-dark auth-glow-light flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b dark:border-white/[0.06] border-black/[0.06] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    {view !== "main" && (
                                        <button
                                            onClick={() => { setView("main"); setError(""); }}
                                            className="p-1.5 -ml-1.5 rounded-xl transition-colors
                                                dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10
                                                text-slate-500 hover:text-slate-900 hover:bg-black/5"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center
                                        bg-gradient-to-br from-violet-600/20 to-indigo-600/10
                                        dark:border dark:border-violet-500/20 border border-violet-400/15"
                                    >
                                        <Settings className="w-4 h-4 text-violet-500" />
                                    </div>
                                    <h2 className="text-lg font-bold dark:text-white text-slate-900 font-display">
                                        {view === "main" ? "Profile Settings" : view === "confirm-clear" ? "Clear Chats" : "Delete Account"}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 rounded-full transition-colors
                                        dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10
                                        text-slate-500 hover:text-slate-900 hover:bg-black/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 overflow-y-auto min-h-[300px]">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                                            animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 16 }}
                                            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                                            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
                                        >
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p className="flex-1 leading-tight">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {view === "main" && (
                                    <motion.div
                                        key="main"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        {/* User Info Card */}
                                        <div className="p-4 rounded-2xl border dark:border-white/[0.06] border-black/[0.06] flex items-center gap-4 mb-6
                                            dark:bg-white/[0.02] bg-black/[0.02]">
                                            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border dark:border-white/[0.1] border-black/[0.1]">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold dark:text-white text-slate-900 truncate">
                                                    {user.displayName || "User"}
                                                </p>
                                                <p className="text-sm dark:text-slate-400 text-slate-500 truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs font-semibold uppercase tracking-widest dark:text-slate-500 text-slate-400 pl-1 mb-2">
                                            Data & Privacy
                                        </p>

                                        {/* Actions */}
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 text-left
                                                dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.05]
                                                bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.05] border
                                                disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                <Download className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm dark:text-slate-200 text-slate-800">Export Data</p>
                                                <p className="text-xs dark:text-slate-500 text-slate-500 truncate">Download your chat history as JSON</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setView("confirm-clear")}
                                            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 text-left
                                                dark:bg-white/[0.04] dark:hover:bg-orange-500/[0.08] dark:border-white/[0.05]
                                                bg-black/[0.03] hover:bg-orange-500/[0.06] border-black/[0.05] border
                                                group border-transparent dark:hover:border-orange-500/20 hover:border-orange-500/20"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                <Trash2 className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm dark:text-slate-200 text-slate-800 group-hover:text-orange-500 transition-colors">Clear All Chats</p>
                                                <p className="text-xs dark:text-slate-500 text-slate-500 truncate">Delete all your conversations</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setView("confirm-delete")}
                                            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 text-left
                                                dark:bg-white/[0.04] dark:hover:bg-red-500/[0.08] dark:border-white/[0.05]
                                                bg-black/[0.03] hover:bg-red-500/[0.06] border-black/[0.05] border
                                                group border-transparent dark:hover:border-red-500/20 hover:border-red-500/20"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                                <UserX className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm dark:text-slate-200 text-slate-800 group-hover:text-red-500 transition-colors">Delete Account</p>
                                                <p className="text-xs dark:text-slate-500 text-slate-500 truncate">Permanently remove your account</p>
                                            </div>
                                        </button>

                                    </motion.div>
                                )}

                                {view === "confirm-clear" && (
                                    <motion.div
                                        key="confirm-clear"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col h-full"
                                    >
                                        <div className="flex-1 flex flex-col items-center text-center pt-4 pb-8">
                                            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                                                <Trash2 className="w-7 h-7 text-orange-500" />
                                            </div>
                                            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-2">Are you absolutely sure?</h3>
                                            <p className="text-sm dark:text-slate-400 text-slate-500 px-4 leading-relaxed">
                                                This will permanently delete <strong className="dark:text-slate-200 text-slate-700">all your chat history</strong>.
                                                This action cannot be undone.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <button
                                                onClick={() => setView("main")}
                                                disabled={isClearing}
                                                className="py-3 px-4 rounded-xl font-semibold text-sm transition-all
                                                    dark:bg-white/[0.08] dark:hover:bg-white/[0.12] dark:text-white
                                                    bg-black/[0.05] hover:bg-black/[0.08] text-slate-800
                                                    disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleClearChats}
                                                disabled={isClearing}
                                                className="py-3 px-4 rounded-xl font-semibold text-sm transition-all
                                                    bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25
                                                    disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isClearing ? "Clearing..." : "Yes, clear chats"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === "confirm-delete" && (
                                    <motion.div
                                        key="confirm-delete"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col h-full"
                                    >
                                        <div className="flex-1 flex flex-col items-center text-center pt-4 pb-8">
                                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                                                <UserX className="w-7 h-7 text-red-500" />
                                            </div>
                                            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-2">Delete Account</h3>
                                            <p className="text-sm dark:text-slate-400 text-slate-500 px-2 leading-relaxed">
                                                This will permanently delete your account and all associated data, including chat history.
                                                <br /><br />
                                                <strong className="text-red-400">This cannot be undone.</strong>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <button
                                                onClick={() => setView("main")}
                                                disabled={isDeleting}
                                                className="py-3 px-4 rounded-xl font-semibold text-sm transition-all
                                                    dark:bg-white/[0.08] dark:hover:bg-white/[0.12] dark:text-white
                                                    bg-black/[0.05] hover:bg-black/[0.08] text-slate-800
                                                    disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                                className="py-3 px-4 rounded-xl font-semibold text-sm transition-all
                                                    bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25
                                                    disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? "Deleting..." : "Yes, delete"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
