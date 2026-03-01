import React from "react";
import { motion } from "framer-motion";
import { Bot, User, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/hooks/useRagBackend";

export function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-5`}
        >
            <div className={`flex gap-3 max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isUser
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                    : "cosmic-glass dark:border dark:border-white/[0.15] border border-black/[0.08]"
                    }`}>
                    {isUser
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 dark:text-violet-300 text-violet-500" />
                    }
                </div>

                {/* Bubble */}
                <div className={`
                    relative px-5 py-4 text-[0.95rem] leading-relaxed rounded-2xl border transition-colors duration-300
                    ${isUser
                        ? "bg-gradient-to-br from-violet-600/90 to-indigo-700/90 text-white/95 rounded-tr-sm border-violet-400/20"
                        : "cosmic-glass-panel rounded-tl-sm dark:text-slate-200 text-slate-800 dark:border-white/[0.05] border-black/[0.05]"
                    }
                `}>
                    {!isUser ? (
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold tracking-tight mb-4 mt-6 dark:text-white/95 text-slate-900 font-display" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold tracking-tight mb-3 mt-5 dark:text-white/95 text-slate-900 font-display" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-medium tracking-tight mb-2.5 mt-4 dark:text-white/90 text-slate-800 font-display" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0 dark:text-slate-300/90 text-slate-700 font-medium leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 dark:text-slate-300/90 text-slate-700 marker:text-violet-400 dark:marker:text-violet-400" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 dark:text-slate-300/90 text-slate-700 marker:text-violet-400 dark:marker:text-violet-400" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                    a: ({ node, ...props }) => <a className="font-semibold dark:text-violet-300 dark:hover:text-violet-200 text-violet-600 hover:text-violet-500 underline underline-offset-4 dark:decoration-violet-400/40 dark:hover:decoration-violet-300/80 decoration-violet-500/40 hover:decoration-violet-500/80 transition-all duration-200" target="_blank" rel="noopener noreferrer" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold dark:text-white text-slate-900 tracking-wide" {...props} />,
                                    hr: ({ node, ...props }) => <hr className="my-6 dark:border-white/[0.08] border-black/[0.06]" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 dark:border-violet-500/50 border-violet-400/40 pl-4 py-1.5 mb-4 italic dark:text-slate-400 text-slate-500 dark:bg-black/20 bg-black/[0.03] rounded-r-xl" {...props} />,
                                    code: ({ node, className, children, ...props }: any) => {
                                        const isInline = !className;
                                        return isInline
                                            ? <code className="dark:bg-black/40 bg-black/[0.05] dark:border-white/[0.08] border-black/[0.06] border rounded-md px-1.5 py-0.5 text-[0.83em] font-mono dark:text-violet-200/90 text-violet-600/90 shadow-inner" {...props}>{children}</code>
                                            : <pre className="dark:bg-[#04040a]/90 bg-slate-100/90 rounded-xl p-4.5 mb-4 overflow-x-auto dark:border-white/[0.08] border-black/[0.06] border dark:shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)]"><code className="font-mono text-sm tracking-tight dark:text-slate-300 text-slate-700 block" {...props}>{children}</code></pre>
                                    }
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        message.content
                    )}

                    {/* Streaming cursor */}
                    {message.isStreaming && (
                        <span className="inline-block ml-0.5 w-[2px] h-4 bg-violet-400 animate-pulse align-middle rounded-full" />
                    )}

                    {/* Sources Section (for AI messages) */}
                    {!isUser && message.sources && message.sources.length > 0 && !message.isStreaming && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="mt-5 pt-3 dark:border-t dark:border-white/[0.08] border-t border-black/[0.06]"
                        >
                            <div className="flex items-center gap-1.5 mb-2.5 text-[0.65rem] font-bold dark:text-slate-500 text-slate-400 uppercase tracking-widest">
                                <FileText className="w-3.5 h-3.5 opacity-80" />
                                <span>Sources</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(message.sources)).filter(Boolean).map((source, idx) => {
                                    const parts = source.split(/[/\\]/);
                                    const filename = parts[parts.length - 1];
                                    if (!filename) return null;
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center px-2.5 py-1 text-[0.75rem] font-medium rounded-md
                                                dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-violet-200/70 dark:hover:bg-white/[0.08] dark:hover:text-violet-200
                                                bg-black/[0.03] border-black/[0.06] text-violet-600/70 hover:bg-black/[0.06] hover:text-violet-600
                                                border transition-colors cursor-help group"
                                            title={source}
                                        >
                                            <span className="truncate max-w-[200px]">{filename}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
