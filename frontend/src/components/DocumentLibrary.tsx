"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trash2, Loader2, Library, CloudOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface DocumentLibraryProps {
    userId: string | null | undefined;
    fetchUserDocuments: () => Promise<string[]>;
    deleteDocument: (fileName: string) => Promise<boolean>;
    refreshTrigger?: number; // bumped after each upload
}

export function DocumentLibrary({
    userId,
    fetchUserDocuments,
    deleteDocument,
    refreshTrigger = 0,
}: DocumentLibraryProps) {
    const [documents, setDocuments] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);

    const loadDocuments = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const docs = await fetchUserDocuments();
            setDocuments(docs);
        } finally {
            setLoading(false);
        }
    }, [userId, fetchUserDocuments]);

    // Load on mount, when userId changes, and after uploads
    useEffect(() => {
        loadDocuments();
    }, [loadDocuments, refreshTrigger]);

    const handleDelete = async (fileName: string) => {
        setDeletingFile(fileName);
        const success = await deleteDocument(fileName);
        if (success) {
            toast.success(`"${fileName}" removed`, {
                description: "All associated vectors have been deleted.",
            });
            await loadDocuments();
        } else {
            toast.error(`Failed to delete "${fileName}"`, {
                description: "Please try again.",
            });
        }
        setDeletingFile(null);
    };

    if (!userId) return null;

    return (
        <div className="flex flex-col gap-2 px-5 pb-4">
            {/* Section Header */}
            <div className="flex items-center gap-2.5 px-1 mb-1">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                    <Library className="w-4 h-4 dark:text-indigo-300 text-indigo-500" />
                </div>
                <h2 className="font-semibold text-[0.9rem] dark:text-slate-200 text-slate-800 tracking-wide font-display">
                    Your Library
                </h2>
                {loading && (
                    <Loader2 className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400 animate-spin ml-auto" />
                )}
            </div>

            {/* Document List */}
            {documents.length > 0 ? (
                <ScrollArea className="max-h-[200px]">
                    <div className="flex flex-col gap-1.5 pr-2">
                        <AnimatePresence initial={false}>
                            {documents.map((fileName) => {
                                const isDeleting = deletingFile === fileName;
                                return (
                                    <motion.div
                                        key={fileName}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="group flex items-center gap-2.5 p-2.5 rounded-xl
                                            dark:bg-white/[0.05] dark:border-white/[0.06] dark:hover:bg-white/[0.08] dark:hover:border-violet-500/20
                                            bg-black/[0.05] border-black/[0.04] hover:bg-black/[0.07] hover:border-violet-400/15
                                            border transition-all duration-200
                                            dark:hover:shadow-[0_0_14px_rgba(139,92,246,0.1)] hover:shadow-[0_0_14px_rgba(139,92,246,0.06)]"
                                    >
                                        <div className="p-1.5 bg-violet-500/10 rounded-md shrink-0">
                                            <FileText className="w-3.5 h-3.5 dark:text-violet-400/70 text-violet-500/70" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium dark:text-slate-300 text-slate-700 truncate">
                                                {fileName}
                                            </p>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(fileName);
                                            }}
                                            disabled={isDeleting}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200
                                                dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10
                                                text-slate-400 hover:text-red-500 hover:bg-red-500/[0.06]
                                                disabled:opacity-100"
                                            title={isDeleting ? "Deleting…" : `Delete ${fileName}`}
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            ) : loading ? null : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-6 gap-2.5 px-4">
                    <div className="p-3 rounded-2xl
                        dark:bg-white/[0.03] dark:border-white/[0.06]
                        bg-black/[0.02] border-black/[0.04]
                        border"
                    >
                        <CloudOff className="w-5 h-5 dark:text-slate-600 text-slate-400" />
                    </div>
                    <p className="text-xs dark:text-slate-500 text-slate-400 text-center font-medium leading-relaxed">
                        No documents found.
                        <br />
                        Upload one to get started.
                    </p>
                </div>
            )}
        </div>
    );
}
