"use client";

import { useState, useEffect, useCallback } from "react";
import {
    collection,
    doc,
    addDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebase } from "@/components/FirebaseProvider";

export interface SessionMeta {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SessionMessage {
    id: string;
    role: "user" | "ai";
    content: string;
    sources?: string[];
    createdAt: Date;
}

export function useChatSessions() {
    const { user } = useFirebase();
    const [sessions, setSessions] = useState<SessionMeta[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    /* ─── Realtime Sessions List ─────────────────────────── */
    useEffect(() => {
        if (!user) {
            setSessions([]);
            setActiveSessionId(null);
            setSessionMessages([]);
            setLoadingSessions(false);
            return;
        }

        setLoadingSessions(true);
        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const q = query(sessionsRef, orderBy("updatedAt", "desc"));

        const unsub = onSnapshot(q, (snapshot) => {
            const list: SessionMeta[] = snapshot.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    title: data.title || "New Chat",
                    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
                };
            });
            setSessions(list);
            setLoadingSessions(false);

            // Auto-select the most recent session on first load
            if (list.length > 0 && !activeSessionId) {
                setActiveSessionId(list[0].id);
            }
        });

        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    /* ─── Load Messages for Active Session ───────────────── */
    useEffect(() => {
        if (!user || !activeSessionId) {
            setSessionMessages([]);
            return;
        }

        const messagesRef = collection(
            db,
            "users",
            user.uid,
            "sessions",
            activeSessionId,
            "messages"
        );
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsub = onSnapshot(q, (snapshot) => {
            const msgs: SessionMessage[] = snapshot.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    role: data.role,
                    content: data.content,
                    sources: data.sources || [],
                    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
                };
            });
            setSessionMessages(msgs);
        });

        return unsub;
    }, [user, activeSessionId]);

    /* ─── Create Session ─────────────────────────────────── */
    const createSession = useCallback(
        async (firstMessage: string): Promise<string | null> => {
            if (!user) return null;

            const title =
                firstMessage.length > 50
                    ? firstMessage.slice(0, 50) + "…"
                    : firstMessage;

            const sessionsRef = collection(db, "users", user.uid, "sessions");
            const docRef = await addDoc(sessionsRef, {
                title,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setActiveSessionId(docRef.id);
            return docRef.id;
        },
        [user]
    );

    /* ─── Add Message ────────────────────────────────────── */
    const addMessage = useCallback(
        async (
            sessionId: string,
            message: { role: "user" | "ai"; content: string; sources?: string[] }
        ) => {
            if (!user) return;

            const messagesRef = collection(
                db,
                "users",
                user.uid,
                "sessions",
                sessionId,
                "messages"
            );

            await addDoc(messagesRef, {
                role: message.role,
                content: message.content,
                sources: message.sources || [],
                createdAt: serverTimestamp(),
            });

            // Touch updatedAt on the session
            const sessionDoc = doc(db, "users", user.uid, "sessions", sessionId);
            await updateDoc(sessionDoc, { updatedAt: serverTimestamp() });
        },
        [user]
    );

    /* ─── Delete Session ─────────────────────────────────── */
    const deleteSession = useCallback(
        async (sessionId: string) => {
            if (!user) return;

            // Delete all messages in the subcollection first
            const messagesRef = collection(
                db,
                "users",
                user.uid,
                "sessions",
                sessionId,
                "messages"
            );
            const msgSnap = await getDocs(messagesRef);
            const batch = writeBatch(db);
            msgSnap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();

            // Delete the session document
            await deleteDoc(doc(db, "users", user.uid, "sessions", sessionId));

            // If we deleted the active session, clear it
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setSessionMessages([]);
            }
        },
        [user, activeSessionId]
    );

    /* ─── New Chat ───────────────────────────────────────── */
    const startNewChat = useCallback(() => {
        setActiveSessionId(null);
        setSessionMessages([]);
    }, []);

    /* ─── Delete All Sessions ────────────────────────────── */
    const deleteAllSessions = useCallback(async () => {
        if (!user) return;

        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const sessionsSnap = await getDocs(sessionsRef);

        for (const sessionDoc of sessionsSnap.docs) {
            const sessionId = sessionDoc.id;

            // Delete messages in this session
            const messagesRef = collection(
                db,
                "users",
                user.uid,
                "sessions",
                sessionId,
                "messages"
            );
            const msgSnap = await getDocs(messagesRef);

            // Firebase limits batch deletes to 500, but chats per session should be reasonable.
            const batch = writeBatch(db);
            msgSnap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();

            // Delete session doc
            await deleteDoc(doc(db, "users", user.uid, "sessions", sessionId));
        }

        setActiveSessionId(null);
        setSessionMessages([]);
    }, [user]);

    /* ─── Export All Sessions ────────────────────────────── */
    const exportAllSessions = useCallback(async () => {
        if (!user) return;

        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const q = query(sessionsRef, orderBy("createdAt", "desc"));
        const sessionsSnap = await getDocs(q);

        const exportData = [];

        for (const sessionDoc of sessionsSnap.docs) {
            const sessionData = sessionDoc.data();
            const sessionId = sessionDoc.id;

            const messagesRef = collection(
                db,
                "users",
                user.uid,
                "sessions",
                sessionId,
                "messages"
            );
            const mq = query(messagesRef, orderBy("createdAt", "asc"));
            const msgSnap = await getDocs(mq);

            const messages = msgSnap.docs.map(d => {
                const md = d.data();
                return {
                    role: md.role,
                    content: md.content,
                    sources: md.sources || [],
                    createdAt: (md.createdAt as Timestamp)?.toDate()?.toISOString() || null
                };
            });

            exportData.push({
                id: sessionId,
                title: sessionData.title || "New Chat",
                createdAt: (sessionData.createdAt as Timestamp)?.toDate()?.toISOString() || null,
                updatedAt: (sessionData.updatedAt as Timestamp)?.toDate()?.toISOString() || null,
                messages
            });
        }

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ragbot_chat_history_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [user]);

    return {
        sessions,
        activeSessionId,
        setActiveSessionId,
        sessionMessages,
        loadingSessions,
        createSession,
        addMessage,
        deleteSession,
        deleteAllSessions,
        exportAllSessions,
        startNewChat,
    };
}
