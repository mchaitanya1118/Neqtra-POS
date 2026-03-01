"use client";

import { useUserStore, Role } from "@/store/useUserStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Edit2, Shield, ShieldAlert, Trash2, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoleListProps {
    onEdit: (role: Role) => void;
}

export function RoleList({ onEdit }: RoleListProps) {
    const { hasPermission } = useAuthStore();
    const { roles, deleteRole } = useUserStore();

    const handleDelete = async (role: Role) => {
        if (role.isSystem) return;
        if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
            await deleteRole(role.id);
        }
    };

    if (roles.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface border border-surface-light p-16 rounded-[40px] text-center"
            >
                <Box className="w-16 h-16 text-muted/20 mx-auto mb-4" />
                <p className="text-muted font-bold text-lg">No roles defined.</p>
                <p className="text-sm text-muted/60 mt-1">Create roles to manage staff permissions.</p>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {roles.map((role) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={role.id}
                        className="group bg-surface border border-surface-light p-5 md:p-6 rounded-3xl md:rounded-[32px] hover:border-primary/50 transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                    >
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 shrink-0",
                                    role.isSystem
                                        ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                        : "bg-primary/10 text-primary border border-primary/20"
                                )}>
                                    {role.isSystem ? <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" /> : <Shield className="w-5 h-5 md:w-6 md:h-6" />}
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(role)}
                                        disabled={!hasPermission('Admin')}
                                        className="p-2 hover:bg-primary/10 rounded-xl text-muted hover:text-primary transition-all disabled:opacity-30"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {!role.isSystem && (
                                        <button
                                            onClick={() => handleDelete(role)}
                                            disabled={!hasPermission('Admin')}
                                            className="p-2 hover:bg-red-500/10 rounded-xl text-muted hover:text-red-500 transition-all disabled:opacity-30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold dark:text-white mb-1">{role.name}</h3>
                                {role.isSystem && (
                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                        System Protected
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 opacity-60">Permissions</p>
                            <div className="flex flex-wrap gap-1.5">
                                {role.permissions?.slice(0, 4).map((perm, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-light/40 border border-surface-light/20 text-muted/80 dark:text-zinc-400">
                                        {perm}
                                    </span>
                                ))}
                                {(role.permissions?.length || 0) > 4 && (
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                        +{role.permissions.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
