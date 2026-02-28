import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
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
            <div className={`flex gap-3 max-w-[82%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isUser
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_24px_rgba(139,92,246,0.5)] ring-2 ring-violet-500/20"
                    : "cosmic-glass border border-white/[0.15] shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-2 ring-white/[0.05]"
                    }`}>
                    {isUser
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-violet-300" />
                    }
                </div>

                {/* Bubble */}
                <div className={`
                    relative px-5 py-4 text-[0.95rem] leading-relaxed rounded-2xl border
                    ${isUser
                        ? "bg-gradient-to-br from-violet-600/90 to-indigo-700/90 text-white/95 rounded-tr-sm shadow-[0_8px_32px_rgba(139,92,246,0.25)] border-violet-400/20"
                        : "cosmic-glass-panel text-slate-200 rounded-tl-sm shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-white/[0.05]"
                    }
                `}>
                    {!isUser ? (
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold tracking-tight mb-4 mt-6 text-white/95 font-display" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold tracking-tight mb-3 mt-5 text-white/95 font-display" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-medium tracking-tight mb-2.5 mt-4 text-white/90 font-display" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-slate-300/90 font-medium leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-slate-300/90 marker:text-violet-400" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-slate-300/90 marker:text-violet-400" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                    a: ({ node, ...props }) => <a className="font-semibold text-violet-300 hover:text-violet-200 underline underline-offset-4 decoration-violet-400/40 hover:decoration-violet-300/80 transition-all duration-200" target="_blank" rel="noopener noreferrer" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
                                    hr: ({ node, ...props }) => <hr className="my-6 border-white/[0.08]" {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-violet-500/50 pl-4 py-1.5 mb-4 italic text-slate-400 bg-black/20 rounded-r-xl" {...props} />,
                                    code: ({ node, className, children, ...props }: any) => {
                                        const isInline = !className;
                                        return isInline
                                            ? <code className="bg-black/40 border border-white/[0.08] rounded-md px-1.5 py-0.5 text-[0.83em] font-mono text-violet-200/90 shadow-inner" {...props}>{children}</code>
                                            : <pre className="bg-[#04040a]/90 rounded-xl p-4.5 mb-4 overflow-x-auto border border-white/[0.08] shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)]"><code className="font-mono text-sm tracking-tight text-slate-300 block" {...props}>{children}</code></pre>
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
                </div>
            </div>
        </motion.div>
    );
}
