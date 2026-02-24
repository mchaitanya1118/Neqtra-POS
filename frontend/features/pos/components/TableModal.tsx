"use client";

import { useState, useEffect } from "react";
import { X, Users, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (label: string, capacity: number) => Promise<void>;
    initialData?: { label: string; capacity: number } | null;
    title: string;
}

export function TableModal({ isOpen, onClose, onSubmit, initialData, title }: TableModalProps) {
    const [label, setLabel] = useState("");
    const [capacity, setCapacity] = useState(4);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLabel(initialData?.label || "");
            setCapacity(initialData?.capacity || 4);
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(label, capacity);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-surface/90 backdrop-blur-xl border border-surface-light rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-8 border-b border-surface-light">
                    <div>
                        <h2 className="text-2xl font-bold font-serif italic text-foreground tracking-tight">{title}</h2>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Registry Update Interface</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-muted hover:text-foreground transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                            <Tag className="w-3 h-3" />
                            Table Label
                        </label>
                        <input
                            required
                            autoFocus
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. AC-01"
                            className="w-full px-5 py-3.5 bg-background/50 border border-surface-light focus:border-primary/50 rounded-[20px] text-foreground placeholder:text-muted focus:outline-none transition-all ring-1 ring-transparent focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                            <Users className="w-3 h-3" />
                            Seating Capacity
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[2, 4, 6, 8].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setCapacity(num)}
                                    className={cn(
                                        "py-3 rounded-2xl border text-sm font-bold transition-all",
                                        capacity === num
                                            ? "bg-primary text-primary-fg border-primary shadow-lg shadow-primary/20"
                                            : "bg-surface-light border-surface-light text-muted hover:text-foreground"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <input
                            required
                            type="number"
                            min="1"
                            value={capacity}
                            onChange={(e) => setCapacity(Number(e.target.value))}
                            className="w-full px-5 py-3.5 bg-background/50 border border-surface-light focus:border-primary/50 rounded-[20px] text-foreground focus:outline-none transition-all mt-2"
                        />
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-[20px] border border-surface-light text-foreground font-bold text-xs uppercase tracking-widest hover:bg-surface-light transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !label}
                            className="flex-1 py-4 rounded-[20px] bg-primary text-primary-fg font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 transition-all hover:scale-[1.02]"
                        >
                            {loading ? "Processing..." : "Save Table"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
