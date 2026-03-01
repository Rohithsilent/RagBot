"use client";

import { useState, useCallback } from "react";

export type MessageRole = "user" | "ai";

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    isStreaming?: boolean;
    sources?: string[];
}

export interface HistoryEntry {
    role: "user" | "assistant";
    content: string;
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export function useRagBackend(userId?: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Helper to wait
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Build auth headers for every request
    const authHeaders = useCallback((): Record<string, string> => {
        if (!userId) return {};
        return { "X-User-Id": userId };
    }, [userId]);

    const sendMessage = useCallback(async (content: string, history: HistoryEntry[] = []) => {
        const userMsgId = Date.now().toString();
        setMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", content },
        ]);
        setIsTyping(true);

        const formData = new FormData();
        formData.append("question", content);

        // Format history as a readable string for the LLM prompt
        if (history.length > 0) {
            const historyStr = history
                .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
                .join("\n");
            formData.append("chat_history", historyStr);
        }

        try {
            const response = await fetch(`${API_BASE}/ask`, {
                method: "POST",
                body: formData,
                headers: authHeaders(),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await response.json();
            const answer = data.response || "No response text found.";
            const sources = data.sources || [];

            // We simulate streaming effect since the backend returns all at once.
            const aiMsgId = (Date.now() + 1).toString();
            setIsTyping(false);

            setMessages((prev) => [
                ...prev,
                { id: aiMsgId, role: "ai", content: "", isStreaming: true, sources },
            ]);

            let currentText = "";
            const tokens = answer.split(" ");
            for (let i = 0; i < tokens.length; i++) {
                currentText += (i === 0 ? "" : " ") + tokens[i];

                // Update the message in state
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === aiMsgId ? { ...msg, content: currentText } : msg
                    )
                );

                // Random small delay for typewriter effect
                await delay(Math.random() * 30 + 10);
            }

            // End streaming state
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
                )
            );

            // Return the final AI response for persistence
            return { answer, sources };

        } catch (error) {
            console.error(error);
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "ai",
                    content: "Sorry, I encountered an error. Please try again.",
                },
            ]);
            return null;
        }
    }, [authHeaders]);

    const handleFileUpload = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        try {
            const response = await fetch(`${API_BASE}/upload_docs`, {
                method: "POST",
                body: formData,
                headers: authHeaders(),
            });

            if (!response.ok) {
                throw new Error("Failed to upload files");
            }

            const data = await response.json();
            return { success: true, message: data.message };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Error uploading files" };
        }
    }, [authHeaders]);

    // ─── New: Fetch user's document list ─────────────────────
    const fetchUserDocuments = useCallback(async (): Promise<string[]> => {
        if (!userId) return [];
        try {
            const response = await fetch(`${API_BASE}/documents`, {
                method: "GET",
                headers: authHeaders(),
            });
            if (!response.ok) throw new Error("Failed to fetch documents");
            const data = await response.json();
            return data.documents || [];
        } catch (error) {
            console.error("Error fetching documents:", error);
            return [];
        }
    }, [userId, authHeaders]);

    // ─── New: Delete a document by filename ──────────────────
    const deleteDocument = useCallback(async (fileName: string): Promise<boolean> => {
        if (!userId) return false;
        try {
            const response = await fetch(`${API_BASE}/documents/${encodeURIComponent(fileName)}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (!response.ok) throw new Error("Failed to delete document");
            return true;
        } catch (error) {
            console.error("Error deleting document:", error);
            return false;
        }
    }, [userId, authHeaders]);

    return {
        messages,
        setMessages,
        isTyping,
        sendMessage,
        handleFileUpload,
        fetchUserDocuments,
        deleteDocument,
    };
}
