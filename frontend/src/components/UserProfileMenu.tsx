"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

export function UserProfileMenu() {
    const { user, signOut } = useFirebase();
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!user) return null;

    const initial = user.displayName
        ? user.displayName.charAt(0).toUpperCase()
        : user.email
            ? user.email.charAt(0).toUpperCase()
            : "U";

    const photoURL = user.photoURL;

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-8 h-8 rounded-full overflow-hidden transition-all duration-300
          hover:shadow-[0_0_16px_rgba(139,92,246,0.3)]
          hover:ring-2 dark:ring-violet-500/30 ring-violet-400/25
          focus:outline-none"
            >
                {photoURL ? (
                    <img
                        src={photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center text-xs font-bold
              bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                    >
                        {initial}
                    </div>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-11 w-64 rounded-2xl overflow-hidden z-50
              auth-glass
              dark:auth-glow-dark auth-glow-light"
                    >
                        {/* User Info */}
                        <div className="px-4 pt-4 pb-3 border-b dark:border-white/[0.06] border-black/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                    {photoURL ? (
                                        <img
                                            src={photoURL}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-sm font-bold
                        bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                                        >
                                            {initial}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    {user.displayName && (
                                        <p className="text-sm font-semibold dark:text-white text-slate-900 truncate">
                                            {user.displayName}
                                        </p>
                                    )}
                                    <p className="text-xs dark:text-slate-400 text-slate-500 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
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
                                    setIsOpen(false);
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

            <ProfileSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
}
