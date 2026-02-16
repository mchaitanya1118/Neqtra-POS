"use client";

import { useUserStore, User } from "@/store/useUserStore";
import { X, Eye, EyeOff, User as UserIcon, Lock, Key, Shield, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
    const { addUser, updateUser, roles, error: storeError } = useUserStore();

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passcode, setPasscode] = useState("");
    const [roleId, setRoleId] = useState<number | "">("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setUsername(user.username || "");
            setPasscode(user.passcode || "");
            if (user.roleRel) {
                setRoleId(user.roleRel.id);
            } else if (user.role) {
                const foundRole = roles.find(r => r.name === user.role);
                if (foundRole) setRoleId(foundRole.id);
            }
            setPassword("");
        } else {
            setName("");
            setUsername("");
            setPassword("");
            setPasscode("");
            setRoleId("");
        }
        setError(null);
    }, [user, isOpen, roles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!name || !username || !passcode || !roleId) {
            setError("All fields are required");
            setIsSubmitting(false);
            return;
        }

        if (!user && !password) {
            setError("Password is required for new users");
            setIsSubmitting(false);
            return;
        }

        try {
            const userData = {
                name, username, passcode,
                roleId: Number(roleId),
            };

            if (user) {
                await updateUser(user.id, {
                    ...userData,
                    ...(password ? { password } : {})
                });
            } else {
                await addUser({ ...userData, password });
            }
            onClose();
        } catch (err: any) {
            setError(storeError || "Failed to save user");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-surface border border-surface-light rounded-[40px] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-surface-light flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <UserCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold dark:text-white">{user ? "Edit Member" : "New Member"}</h2>
                                    <p className="text-xs text-muted">Set up credentials and system access.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-surface-light rounded-full transition-colors text-muted hover:text-foreground">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Full Name</label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Username</label>
                                    <div className="relative group">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">
                                        {user ? "New Password" : "Password"}
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-12 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">PIN Passcode</label>
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={passcode}
                                            onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
                                            className="w-full pl-11 pr-4 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white"
                                            placeholder="1234"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Assigned Role</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                    <select
                                        value={roleId}
                                        onChange={(e) => setRoleId(Number(e.target.value))}
                                        className="w-full pl-11 pr-4 py-3.5 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white appearance-none"
                                    >
                                        <option value="">Select a role...</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-8 py-4 bg-surface-light hover:bg-surface-light/80 text-foreground font-bold rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] px-8 py-4 bg-primary hover:bg-primary/90 text-black font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Processing..." : user ? "Update Member" : "Create Member"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
