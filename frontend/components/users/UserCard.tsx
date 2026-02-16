"use client";

import { User } from "@/store/useUserStore";
import { Edit, Trash2, Shield, User as UserIcon, Mail, Key } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
    const roleName = user.roleRel?.name || user.role;
    const isAdmin = roleName === "Admin";
    const isManager = roleName === "Manager";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-surface border border-surface-light p-5 rounded-[28px] hover:border-primary/50 hover:shadow-xl transition-all relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
                isAdmin ? "bg-purple-500" : isManager ? "bg-blue-500" : "bg-primary"
            )} />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                    {/* Avatar placeholder */}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                        isAdmin ? "bg-purple-500/10 text-purple-500" :
                            isManager ? "bg-blue-500/10 text-blue-500" :
                                "bg-primary/10 text-primary"
                    )}>
                        <UserIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white group-hover:text-primary transition-colors">{user.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                                isAdmin ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" :
                                    isManager ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                        "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            )}>
                                {roleName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button
                        onClick={() => onEdit(user)}
                        className="p-2.5 hover:bg-primary/10 rounded-xl text-muted hover:text-primary transition-all"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(user.id)}
                        className="p-2.5 hover:bg-red-500/10 rounded-xl text-muted hover:text-red-500 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-surface-light/30 border border-surface-light/20 p-3 rounded-2xl flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary/60" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Username</p>
                        <p className="text-xs font-semibold truncate dark:text-zinc-300">{user.username || "-"}</p>
                    </div>
                </div>
                <div className="bg-surface-light/30 border border-surface-light/20 p-3 rounded-2xl flex items-center gap-3">
                    <Key className="w-4 h-4 text-primary/60" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">Passcode</p>
                        <p className="text-xs font-semibold truncate dark:text-zinc-300">{user.passcode ? "••••" : "-"}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
