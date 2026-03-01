import React from "react";
import { motion } from "framer-motion";
import { Upload, MessageSquare, FileSearch } from "lucide-react";

interface QuickActionsProps {
    onActionClick: (action: string) => void;
    onUploadClick: () => void;
}

const suggestions = [
    {
        icon: Upload,
        label: "Upload Documents",
        action: "upload",
    },
    {
        icon: FileSearch,
        label: "Summarize my docs",
        action: "Summarize the uploaded documents",
    },
    {
        icon: MessageSquare,
        label: "Ask a question",
        action: "What are the key takeaways from my documents?",
    },
];

export function QuickActions({ onActionClick, onUploadClick }: QuickActionsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-wrap justify-center gap-2.5 mt-6"
        >
            {suggestions.map((item, idx) => (
                <motion.button
                    key={idx}
                    onClick={() => item.action === "upload" ? onUploadClick() : onActionClick(item.action)}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full cosmic-glass transition-all duration-300 text-[0.88rem] font-medium tracking-wide group
                        dark:border dark:border-white/[0.08] dark:hover:border-violet-400/40 dark:hover:bg-violet-500/[0.06]
                        dark:text-slate-300 dark:hover:text-white dark:hover:shadow-[0_4px_24px_rgba(139,92,246,0.15)]
                        border border-black/[0.06] hover:border-violet-400/30 hover:bg-violet-500/[0.04]
                        text-slate-600 hover:text-slate-900 hover:shadow-[0_4px_24px_rgba(139,92,246,0.08)]"
                >
                    <div className="p-1 rounded-md dark:bg-white/[0.04] dark:group-hover:bg-violet-500/20 bg-black/[0.03] group-hover:bg-violet-500/10 transition-colors duration-300">
                        <item.icon className="w-3.5 h-3.5 dark:text-violet-400/80 dark:group-hover:text-violet-300 text-violet-500/70 group-hover:text-violet-500" />
                    </div>
                    {item.label}
                </motion.button>
            ))}
        </motion.div>
    );
}
