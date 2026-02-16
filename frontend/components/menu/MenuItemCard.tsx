"use client";

import { Edit, Trash2, Flame, Leaf, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMenuStore } from "@/store/useMenuStore";
import { useState } from "react";

interface MenuItemCardProps {
    item: any;
    onEdit: (item: any) => void;
}

export function MenuItemCard({ item, onEdit }: MenuItemCardProps) {
    const { deleteItem, updateItem } = useMenuStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Remove "${item.title}" from the menu?`)) return;
        setIsDeleting(true);
        try {
            await deleteItem(item.id);
        } catch (error) {
            console.error(error);
            setIsDeleting(false);
        }
    };

    const toggleAvailability = async () => {
        setIsUpdating(true);
        try {
            await updateItem(item.id, { isAvailable: !item.isAvailable });
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative bg-surface border border-surface-light p-5 rounded-[32px] hover:border-primary/50 hover:shadow-2xl transition-all overflow-hidden flex flex-col h-full",
                !item.isAvailable && "opacity-75 grayscale-[0.5]"
            )}
        >
            {/* Image Section */}
            <div className="relative h-44 -mx-2 -mt-2 mb-4 rounded-[24px] overflow-hidden bg-surface-light/30 border border-surface-light/50">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted/20">
                        <Loader2 className="w-12 h-12 animate-pulse" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.isVegetarian && (
                        <div className="bg-green-500/90 backdrop-blur-md text-white p-2 rounded-xl shadow-lg" title="Vegetarian">
                            <Leaf className="w-4 h-4" />
                        </div>
                    )}
                    {item.isSpicy && (
                        <div className="bg-red-500/90 backdrop-blur-md text-white p-2 rounded-xl shadow-lg" title="Spicy">
                            <Flame className="w-4 h-4" />
                        </div>
                    )}
                </div>

                {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Sold Out</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-lg tracking-tight leading-tight dark:text-white line-clamp-1">{item.title}</h3>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-black whitespace-nowrap border border-primary/20">
                        ₹{item.price}
                    </div>
                </div>

                {item.description && (
                    <p className="text-xs text-muted font-medium line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-surface-light/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleAvailability}
                        disabled={isUpdating}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            item.isAvailable
                                ? "bg-primary/10 text-primary hover:bg-primary hover:text-black"
                                : "bg-surface-light text-muted hover:text-foreground"
                        )}
                    >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (item.isAvailable ? "Available" : "Hidden")}
                    </button>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2.5 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Edit Item"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2.5 text-muted hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        title="Delete Item"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
