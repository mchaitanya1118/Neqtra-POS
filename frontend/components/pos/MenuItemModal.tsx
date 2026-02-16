"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Sparkles, Flame, Leaf, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    title: string;
}

export function MenuItemModal({ isOpen, onClose, onSubmit, initialData, title }: MenuItemModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        price: "",
        description: "",
        imageUrl: "",
        isVegetarian: true,
        isSpicy: false,
        isAvailable: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title || "",
                price: initialData.price?.toString() || "",
                description: initialData.description || "",
                imageUrl: initialData.imageUrl || "",
                isVegetarian: initialData.isVegetarian ?? true,
                isSpicy: initialData.isSpicy ?? false,
                isAvailable: initialData.isAvailable ?? true
            });
        } else if (isOpen) {
            setFormData({
                title: "",
                price: "",
                description: "",
                imageUrl: "",
                isVegetarian: true,
                isSpicy: false,
                isAvailable: true
            });
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                price: Number(formData.price)
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className="bg-surface border border-surface-light rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-8 border-b border-surface-light bg-surface/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg border border-primary/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight dark:text-white">{title}</h2>
                            <p className="text-xs text-muted font-bold uppercase tracking-widest">Culinary Configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-surface-light rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-muted group-hover:text-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 ml-1">Signature Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Truffle Infused Risotto"
                                    className="w-full px-6 py-4 rounded-[20px] border border-surface-light bg-surface-light/30 focus:bg-surface-light/50 focus:ring-4 ring-primary/10 outline-none transition-all font-bold text-foreground placeholder:text-muted/40"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 ml-1">Price Point (₹)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-6 py-4 rounded-[20px] border border-surface-light bg-surface-light/30 focus:bg-surface-light/50 focus:ring-4 ring-primary/10 outline-none transition-all font-bold text-foreground placeholder:text-muted/40"
                                />
                            </div>
                        </div>

                        {/* Image Preview / URL */}
                        <div>
                            <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 ml-1">Visual Identity (URL)</label>
                            <div className="relative group">
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full px-6 py-4 pr-14 rounded-[20px] border border-surface-light bg-surface-light/30 focus:bg-surface-light/50 focus:ring-4 ring-primary/10 outline-none transition-all font-bold text-foreground placeholder:text-muted/40"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/40">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="mt-4 h-32 rounded-[24px] border border-surface-light/50 border-dashed flex items-center justify-center overflow-hidden bg-surface-light/20">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted/20">
                                        <ImageIcon className="w-8 h-8" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Preview Preview</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 ml-1">Chef's Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the flavors, ingredients, and preparation..."
                            className="w-full px-6 py-4 rounded-[24px] border border-surface-light bg-surface-light/30 focus:bg-surface-light/50 focus:ring-4 ring-primary/10 outline-none transition-all font-bold text-foreground placeholder:text-muted/40 resize-none min-h-[120px]"
                        />
                    </div>

                    {/* Attributes */}
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isVegetarian: !formData.isVegetarian })}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all",
                                formData.isVegetarian
                                    ? "bg-green-500/10 border-green-500/30 text-green-500"
                                    : "bg-surface-light/30 border-surface-light text-muted"
                            )}
                        >
                            <Leaf className={cn("w-6 h-6 transition-transform", formData.isVegetarian && "scale-110")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Vegetarian</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isSpicy: !formData.isSpicy })}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all",
                                formData.isSpicy
                                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                                    : "bg-surface-light/30 border-surface-light text-muted"
                            )}
                        >
                            <Flame className={cn("w-6 h-6 transition-transform", formData.isSpicy && "scale-110")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Spicy</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all",
                                formData.isAvailable
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-orange-500/10 border-orange-500/30 text-orange-500"
                            )}
                        >
                            {formData.isAvailable ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {formData.isAvailable ? "Available" : "Archived"}
                            </span>
                        </button>
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
                            disabled={loading}
                            className="flex-1 px-8 py-4 rounded-[24px] bg-primary text-black font-black uppercase tracking-widest text-xs hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Synchronizing..." : "Preserve Detail"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
