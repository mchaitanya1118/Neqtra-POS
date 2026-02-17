"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { InventoryItem, useInventoryStore } from "@/store/useInventoryStore";
import {
    Package,
    AlertTriangle,
    Trash2,
    Edit,
    Plus,
    Minus,
    TrendingUp,
    Box,
    DollarSign,
    Layers,
    Clock,
    User
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InventoryCardProps {
    item: InventoryItem;
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: number) => void;
}

export function InventoryCard({ item, onEdit, onDelete }: InventoryCardProps) {
    const { hasPermission } = useAuthStore();
    const quickAdjust = useInventoryStore(state => state.quickAdjust);

    const isOutOfStock = item.quantity === 0;
    const isLowStock = !isOutOfStock && item.quantity <= item.threshold;

    const getStatusStyles = () => {
        if (isOutOfStock) return "bg-red-500/10 text-red-500 border-red-500/20";
        if (isLowStock) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        return "bg-green-500/10 text-green-500 border-green-500/20";
    };

    const getStatusLabel = () => {
        if (isOutOfStock) return "Out of Stock";
        if (isLowStock) return "Low Stock";
        return "In Stock";
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-surface border border-surface-light p-6 rounded-[32px] hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden flex flex-col h-full"
        >
            {/* Status Badge & Actions */}
            <div className="flex justify-between items-start mb-6">
                <div className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                    getStatusStyles()
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full bg-current", (isLowStock || isOutOfStock) && "animate-pulse")} />
                    {getStatusLabel()}
                </div>

                <div className="flex gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <button
                        onClick={() => onEdit(item)}
                        disabled={!hasPermission('Inventory')}
                        className="p-2.5 bg-surface-light text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-30"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        disabled={!hasPermission('Inventory')}
                        className="p-2.5 bg-surface-light text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-30"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Header Content */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <Package className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-xl font-black dark:text-white truncate max-w-[180px]">{item.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-wider mt-1">
                        <Box className="w-3 h-3" />
                        ID: #{item.id}
                    </div>
                </div>
            </div>

            {/* Metrics Section */}
            <div className="space-y-4 mb-8 flex-1">
                <div className="p-4 bg-surface-light/30 rounded-2xl border border-surface-light/50 group-hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-surface-light flex items-center justify-center text-muted">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Quantity</p>
                                <p className={cn(
                                    "font-bold text-lg font-mono",
                                    isOutOfStock ? "text-red-500" : isLowStock ? "text-yellow-600" : "text-foreground"
                                )}>
                                    {item.quantity} <span className="text-xs text-muted font-normal">{item.unit}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-surface-light/50 rounded-lg p-1">
                            <button
                                onClick={() => quickAdjust(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-muted hover:text-red-500 disabled:opacity-50"
                                disabled={item.quantity <= 0 || !hasPermission('Inventory')}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => quickAdjust(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all text-muted hover:text-green-500 disabled:opacity-50"
                                disabled={!hasPermission('Inventory')}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-surface-light/50 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Price</p>
                            <div className="flex items-center gap-1 font-bold text-sm">
                                <DollarSign className="w-3 h-3 text-muted" />
                                {Number(item.price).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Value</p>
                            <div className="flex items-center gap-1 font-bold text-sm text-primary">
                                <DollarSign className="w-3 h-3" />
                                {(item.quantity * item.price).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-1">
                    <User className="w-4 h-4 text-muted/40" />
                    <p className="text-xs text-muted/80 truncate">
                        <span className="font-black text-[9px] uppercase tracking-widest text-muted/50 mr-2">Supplier:</span>
                        {item.supplier || 'No Supplier assigned'}
                    </p>
                </div>
            </div>

            {/* Footer Section */}
            <div className="mt-auto pt-6 border-t border-surface-light flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    <p className="text-[9px] font-bold text-muted uppercase tracking-wider">
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                </div>

                {isLowStock && (
                    <div className="flex items-center gap-1.5 text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Restock Soon</span>
                    </div>
                )}
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 text-primary/5 -mr-4 -mt-4 rotate-12 group-hover:rotate-45 group-hover:scale-150 transition-all duration-700 pointer-events-none">
                <Layers className="w-32 h-32" />
            </div>
        </motion.div>
    );
}
