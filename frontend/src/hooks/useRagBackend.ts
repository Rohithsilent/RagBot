"use client";

import { useState, useCallback } from "react";

export type MessageRole = "user" | "ai";

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    isStreaming?: boolean;
}

export function useRagBackend() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Helper to wait
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const sendMessage = useCallback(async (content: string) => {
        const userMsgId = Date.now().toString();
        setMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", content },
        ]);
        setIsTyping(true);

        const formData = new FormData();
        formData.append("question", content);

        try {
            const response = await fetch("http://localhost:8000/ask/", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await response.json();
            const answer = data.response || "No response text found.";

            // We simulate streaming effect since the backend returns all at once.
            const aiMsgId = (Date.now() + 1).toString();
            setIsTyping(false);

            setMessages((prev) => [
                ...prev,
                { id: aiMsgId, role: "ai", content: "", isStreaming: true },
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
        }
    }, []);

    const handleFileUpload = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        try {
            const response = await fetch("http://localhost:8000/upload_pdfs/", {
                method: "POST",
                body: formData,
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
    }, []);

    return {
        messages,
        isTyping,
        sendMessage,
        handleFileUpload,
    };
}
