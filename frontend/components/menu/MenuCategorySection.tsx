"use client";

import { Edit, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import * as Icons from "lucide-react";
import { MenuItemCard } from "./MenuItemCard";

interface MenuCategorySectionProps {
    category: any;
    onEditCategory: (category: any) => void;
    onDeleteCategory: (id: number, title: string) => void;
    onAddItem: (categoryId: number) => void;
    onEditItem: (item: any) => void;
}

export function MenuCategorySection({
    category,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem
}: MenuCategorySectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const renderIcon = (iconName: string) => {
        const Icon = (Icons as any)[iconName] || Icons.HelpCircle;
        return <Icon className="w-5 h-5" />;
    };

    const variantStyles: any = {
        mint: "text-primary bg-primary/10 border-primary/20",
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        green: "text-green-500 bg-green-500/10 border-green-500/20",
        red: "text-red-500 bg-red-500/10 border-red-500/20",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        pink: "text-pink-500 bg-pink-500/10 border-pink-500/20",
        yellow: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
        purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    };

    const currentStyle = variantStyles[category.variant] || variantStyles.mint;

    return (
        <div className="space-y-6">
            {/* Category Header */}
            <div className="flex items-center justify-between sticky top-24 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 rounded-3xl border border-transparent hover:border-surface-light transition-all">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-surface-light rounded-xl transition-all"
                    >
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-muted" /> : <ChevronRight className="w-5 h-5 text-muted" />}
                    </button>

                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg shadow-black/5", currentStyle)}>
                        {renderIcon(category.icon)}
                    </div>

                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black tracking-tight dark:text-white">{category.title}</h2>
                            <span className="px-3 py-1 rounded-full bg-surface-light text-muted text-[10px] font-black uppercase tracking-widest border border-surface-light">
                                {category.items.length} Units
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEditCategory(category)}
                        className="p-3 text-muted hover:text-primary hover:bg-primary/10 rounded-2xl transition-all"
                        title="Edit Category"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDeleteCategory(category.id, category.title)}
                        className="p-3 text-muted hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                        title="Delete Category"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-surface-light mx-2" />
                    <button
                        onClick={() => onAddItem(category.id)}
                        className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>
            </div>

            {/* Items Grid */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {category.items.map((item: any) => (
                            <MenuItemCard
                                key={item.id}
                                item={item}
                                onEdit={onEditItem}
                            />
                        ))}

                        {category.items.length === 0 && (
                            <div className="col-span-full py-12 bg-surface/30 border border-surface-light border-dashed rounded-[40px] text-center">
                                <p className="text-muted font-bold italic">No items found in this category.</p>
                                <button
                                    onClick={() => onAddItem(category.id)}
                                    className="mt-4 text-primary text-xs font-black uppercase tracking-widest hover:underline"
                                >
                                    + Create First Item
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
