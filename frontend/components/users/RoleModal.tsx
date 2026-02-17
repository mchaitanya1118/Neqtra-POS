"use client";

import { useUserStore, Role } from "@/store/useUserStore";
import { X, Shield, Check, Info, Layout, ShoppingCart, Calendar, Table, CreditCard, Truck, Package, IndianRupee, BarChart2, Menu, Users, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    role?: Role;
}

const PERMISSION_GROUPS = [
    {
        name: "Dashboard & Insights",
        icon: Activity,
        permissions: ["Dashboard", "Reports"]
    },
    {
        name: "Sales & Orders",
        icon: ShoppingCart,
        permissions: ["Orders", "Billing", "Delivery", "KDS"]
    },
    {
        name: "Front Desktop",
        icon: Table,
        permissions: ["Reservations", "Table Services"]
    },
    {
        name: "Back Office",
        icon: Package,
        permissions: ["Inventory", "Dues", "Menu", "Accounting"]
    },
    {
        name: "Administration",
        icon: Shield,
        permissions: ["Users"]
    }
];

const ALL_PERMS = PERMISSION_GROUPS.flatMap(g => g.permissions);

export function RoleModal({ isOpen, onClose, role }: RoleModalProps) {
    const { addRole, updateRole, error: storeError } = useUserStore();
    const [name, setName] = useState("");
    const [permissions, setPermissions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (role) {
            setName(role.name);
            setPermissions(role.permissions || []);
        } else {
            setName("");
            setPermissions([]);
        }
        setError(null);
    }, [role, isOpen]);

    const handleTogglePermission = (perm: string) => {
        setPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        );
    };

    const handleSelectAll = (perms: string[]) => {
        const allSelected = perms.every(p => permissions.includes(p));
        if (allSelected) {
            setPermissions(prev => prev.filter(p => !perms.includes(p)));
        } else {
            setPermissions(prev => Array.from(new Set([...prev, ...perms])));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (role) {
                await updateRole(role.id, { name, permissions });
            } else {
                await addRole({ name, permissions, isSystem: false });
            }
            onClose();
        } catch (err) {
            setError(storeError || "Failed to save role");
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
                        className="relative w-full max-w-2xl bg-surface border border-surface-light rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-8 border-b border-surface-light flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold dark:text-white">{role ? "Edit Role" : "New Security Role"}</h2>
                                    <p className="text-xs text-muted">Define access levels and system permissions.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-surface-light rounded-full transition-colors text-muted hover:text-foreground">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Role Identifier</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-6 py-4 bg-surface-light/30 border border-surface-light/50 rounded-2xl focus:outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all dark:text-white text-lg font-bold"
                                        placeholder="e.g. Finance Admin"
                                        required
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-muted">Permission Matrix</h3>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAll(ALL_PERMS)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            Toggle All
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {PERMISSION_GROUPS.map((group) => {
                                            const GroupIcon = group.icon;
                                            const allGroupSelected = group.permissions.every(p => permissions.includes(p));

                                            return (
                                                <div key={group.name} className="bg-surface-light/20 border border-surface-light/30 rounded-3xl p-5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-primary">
                                                            <GroupIcon className="w-4 h-4" />
                                                            <span className="text-xs font-bold uppercase tracking-tight text-foreground">{group.name}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectAll(group.permissions)}
                                                            className={cn(
                                                                "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                                                                allGroupSelected ? "bg-primary border-primary text-black" : "border-surface-light hover:border-primary/50"
                                                            )}
                                                        >
                                                            <Check className={cn("w-3.5 h-3.5", allGroupSelected ? "opacity-100" : "opacity-0")} />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {group.permissions.map((perm) => (
                                                            <button
                                                                key={perm}
                                                                type="button"
                                                                onClick={() => handleTogglePermission(perm)}
                                                                className={cn(
                                                                    "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                                                                    permissions.includes(perm)
                                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                                        : "bg-surface-light/30 border-transparent text-muted hover:bg-surface-light/50"
                                                                )}
                                                            >
                                                                {perm}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-8 border-t border-surface-light flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-8 py-4 bg-surface-light hover:bg-surface-light/80 text-foreground font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] px-8 py-4 bg-primary hover:bg-primary/90 text-black font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Saving..." : role ? "Save Global Changes" : "Create Security Role"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
