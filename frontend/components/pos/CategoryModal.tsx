"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, icon: string, variant: string) => Promise<void>;
    initialData?: { title: string; icon: string; variant: string } | null;
    title: string;
}

export function CategoryModal({ isOpen, onClose, onSubmit, initialData, title }: CategoryModalProps) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("Soup");
    const [variant, setVariant] = useState("orange");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.title || "");
            setIcon(initialData?.icon || "Soup");
            setVariant(initialData?.variant || "orange");
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-zinc-800">
                    <h2 className="text-xl font-bold dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category Title
                        </label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Soups, Starters"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Icon Name
                            </label>
                            <input
                                required
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="e.g. Soup, Salad"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            <span className="text-xs text-gray-500">Lucide icon name</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Variant Color
                            </label>
                            <select
                                value={variant}
                                onChange={(e) => setVariant(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            >
                                <option value="orange">Orange</option>
                                <option value="green">Green</option>
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="pink">Pink</option>
                                <option value="yellow">Yellow</option>
                                <option value="gray">Gray</option>
                                <option value="brown">Brown</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Saving..." : "Save Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
