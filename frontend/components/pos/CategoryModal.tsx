"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Palette, LayoutGrid } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, icon: string, variant: string) => Promise<void>;
    initialData?: { title: string; icon: string; variant: string } | null;
    title: string;
}

const VARIANTS = [
    { id: "mint", color: "bg-[#69D7BD]" },
    { id: "orange", color: "bg-orange-500" },
    { id: "green", color: "bg-green-500" },
    { id: "red", color: "bg-red-500" },
    { id: "blue", color: "bg-blue-500" },
    { id: "pink", color: "bg-pink-500" },
    { id: "yellow", color: "bg-yellow-500" },
    { id: "purple", color: "bg-purple-500" },
];

const SUGGESTED_ICONS = ["Utensils", "Coffee", "Pizza", "Beer", "Soup", "Dessert", "Salad", "Sandwich", "Fish", "Beef"];

export function CategoryModal({ isOpen, onClose, onSubmit, initialData, title }: CategoryModalProps) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("Utensils");
    const [variant, setVariant] = useState("mint");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.title || "");
            setIcon(initialData?.icon || "Utensils");
            setVariant(initialData?.variant || "mint");
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(name, icon, variant);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderIcon = (name: string, size = 20) => {
        const Icon = (Icons as any)[name] || Icons.HelpCircle;
        return <Icon size={size} />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-surface border border-surface-light rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-8 border-b border-surface-light bg-surface/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg border border-primary/20">
                            <FolderPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight dark:text-white">{title}</h2>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">Gallery Classification</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-surface-light rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-muted group-hover:text-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Category Name */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Establishment Title</label>
                        <div className="relative group">
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Artisanal Desserts"
                                className="w-full px-6 py-4 rounded-[20px] border border-surface-light bg-surface-light/30 focus:bg-surface-light/50 focus:ring-4 ring-primary/10 outline-none transition-all font-bold text-foreground placeholder:text-muted/40"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted/40 group-focus-within:text-primary">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Variant Selector */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5" />
                            Aesthetic Palette
                        </label>
                        <div className="flex flex-wrap gap-3 p-4 bg-surface-light/20 rounded-[24px] border border-surface-light/50">
                            {VARIANTS.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setVariant(v.id)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all border-2",
                                        v.color,
                                        variant === v.id ? "scale-125 border-white shadow-xl" : "border-transparent opacity-50 hover:opacity-100"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 ml-1">Symbol Representation</label>
                        <div className="grid grid-cols-5 gap-3">
                            {SUGGESTED_ICONS.map((iconName) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => setIcon(iconName)}
                                    className={cn(
                                        "flex items-center justify-center p-4 rounded-2xl border transition-all",
                                        icon === iconName
                                            ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-110"
                                            : "bg-surface-light/30 border-surface-light text-muted hover:text-foreground"
                                    )}
                                    title={iconName}
                                >
                                    {renderIcon(iconName)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-4 rounded-[24px] border border-surface-light hover:bg-surface-light text-muted hover:text-foreground font-black uppercase tracking-widest text-xs transition-all"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-8 py-4 rounded-[24px] bg-primary text-black font-black uppercase tracking-widest text-xs hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Etching..." : "Finalize Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
