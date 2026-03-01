"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    deleteUser as firebaseDeleteUser,
    type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Mail,
    Lock,
    LogIn,
    UserPlus,
    Eye,
    EyeOff,
    Sparkles,
} from "lucide-react";

/* ─── Context ─────────────────────────────────────────── */

interface FirebaseContextValue {
    user: User | null;
    loading: boolean;
    showAuthModal: boolean;
    setShowAuthModal: (v: boolean) => void;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue>({
    user: null,
    loading: true,
    showAuthModal: false,
    setShowAuthModal: () => { },
    signOut: async () => { },
    deleteAccount: async () => { },
});

export const useFirebase = () => useContext(FirebaseContext);

/* ─── Provider ────────────────────────────────────────── */

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
            if (u) setShowAuthModal(false);
        });
        return unsubscribe;
    }, []);

    const handleSignOut = useCallback(async () => {
        await firebaseSignOut(auth);
        setUser(null);
    }, []);

    const handleDeleteAccount = useCallback(async () => {
        if (!user) return;
        try {
            await firebaseDeleteUser(user);
            setUser(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    }, [user]);

    return (
        <FirebaseContext.Provider
            value={{
                user,
                loading,
                showAuthModal,
                setShowAuthModal,
                signOut: handleSignOut,
                deleteAccount: handleDeleteAccount,
            }}
        >
            {children}
            <AuthGateModal
                open={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </FirebaseContext.Provider>
    );
}

/* ─── Auth Gate Modal ─────────────────────────────────── */

function AuthGateModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const reset = () => {
        setEmail("");
        setPassword("");
        setError("");
        setBusy(false);
        setShowPassword(false);
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setError("");
        setBusy(true);
        try {
            if (mode === "signup") {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            reset();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Authentication failed";
            setError(message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
            setBusy(false);
        }
    };

    const handleGoogle = async () => {
        setError("");
        setBusy(true);
        try {
            await signInWithPopup(auth, googleProvider);
            reset();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Google sign-in failed";
            setError(message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
            setBusy(false);
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                    >
                        <div
                            className="relative w-full max-w-md overflow-hidden rounded-3xl
                auth-glass
                dark:auth-glow-dark auth-glow-light"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 p-2 rounded-full
                  dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10
                  text-slate-500 hover:text-slate-900 hover:bg-black/5
                  transition-all duration-200"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="px-8 pt-8 pb-10">
                                {/* Header */}
                                <div className="flex flex-col items-center mb-8">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4
                      bg-gradient-to-br from-violet-600/20 to-indigo-600/10
                      dark:border dark:border-violet-500/20 border border-violet-400/15
                      shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                                    >
                                        <Sparkles className="w-7 h-7 text-violet-400" />
                                    </div>
                                    <h2 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight font-display">
                                        Welcome to RagBot
                                    </h2>
                                    <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
                                        Sign in to save your conversations
                                    </p>
                                </div>

                                {/* Google Button */}
                                <button
                                    onClick={handleGoogle}
                                    disabled={busy}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                    font-semibold text-sm tracking-wide transition-all duration-300
                    dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:text-white dark:border-white/[0.08]
                    bg-black/[0.04] hover:bg-black/[0.08] text-slate-800 border-black/[0.06]
                    border disabled:opacity-50 disabled:cursor-not-allowed
                    hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Continue with Google
                                </button>

                                {/* Divider */}
                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 h-px dark:bg-white/[0.06] bg-black/[0.06]" />
                                    <span className="text-xs font-medium uppercase tracking-widest dark:text-slate-500 text-slate-400">
                                        or
                                    </span>
                                    <div className="flex-1 h-px dark:bg-white/[0.06] bg-black/[0.06]" />
                                </div>

                                {/* Email / Password Form */}
                                <form onSubmit={handleEmailAuth} className="space-y-3">
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium
                        dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-500 dark:border-white/[0.06]
                        bg-black/[0.03] text-slate-900 placeholder:text-slate-400 border-black/[0.05]
                        border outline-none transition-all
                        dark:focus:border-violet-500/40 focus:border-violet-400/40
                        dark:focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400 pointer-events-none" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium
                        dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-500 dark:border-white/[0.06]
                        bg-black/[0.03] text-slate-900 placeholder:text-slate-400 border-black/[0.05]
                        border outline-none transition-all
                        dark:focus:border-violet-500/40 focus:border-violet-400/40
                        dark:focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] focus:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 dark:text-slate-500 dark:hover:text-slate-300 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs text-red-400 font-medium px-1 overflow-hidden"
                                            >
                                                {error}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={busy || !email.trim() || !password.trim()}
                                        className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300
                      bg-gradient-to-r from-violet-600 to-indigo-600 text-white
                      hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]
                      active:scale-[0.98]
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {mode === "signin" ? (
                                                <>
                                                    <LogIn className="w-4 h-4" /> Sign In
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-4 h-4" /> Create Account
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </form>

                                {/* Toggle Mode */}
                                <p className="text-center text-xs dark:text-slate-500 text-slate-400 mt-5">
                                    {mode === "signin"
                                        ? "Don't have an account?"
                                        : "Already have an account?"}{" "}
                                    <button
                                        onClick={() => {
                                            setMode(mode === "signin" ? "signup" : "signin");
                                            setError("");
                                        }}
                                        className="font-semibold dark:text-violet-400 text-violet-500 hover:underline underline-offset-2 transition-colors"
                                    >
                                        {mode === "signin" ? "Sign Up" : "Sign In"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
