"use client";

import { useState, useRef } from "react";
import {
    X, Camera, Upload, Loader2, CheckCircle2,
    AlertCircle, ChevronRight, Edit3, Trash2,
    Save, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMenuStore } from "@/store/useMenuStore";

interface AIMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIMenuModal({ isOpen, onClose }: AIMenuModalProps) {
    const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const extractMenu = useMenuStore(state => state.extractMenu);
    const addCategory = useMenuStore(state => state.addCategory);
    const addItem = useMenuStore(state => state.addItem);
    const fetchMenu = useMenuStore(state => state.fetchMenu);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            startExtraction(selected);
        }
    };

    const startExtraction = async (selectedFile: File) => {
        setFile(selectedFile);
        setStep('processing');
        setError(null);

        try {
            const data = await extractMenu(selectedFile);
            setExtractedData(data);
            setStep('preview');
        } catch (err) {
            setError("Failed to extract menu. Please try a clearer photo.");
            setStep('upload');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const currentCategories = useMenuStore.getState().categories;

            for (const catData of extractedData.categories) {
                // Check if category already exists to avoid duplication
                let targetCat = currentCategories.find(c =>
                    c.title.toLowerCase() === catData.title.toLowerCase()
                );

                if (!targetCat) {
                    targetCat = await addCategory(catData.title, 'Utensils', 'orange');
                }

                if (targetCat) {
                    for (const item of catData.items) {
                        await addItem(targetCat.id, {
                            title: item.title,
                            price: item.price,
                            description: item.description,
                            isAvailable: true
                        });
                    }
                }
            }
            onClose();
            setStep('upload');
            setExtractedData(null);
            setFile(null);
        } catch (err) {
            console.error("Save failed:", err);
            setError("Failed to save some items. Please check your connection.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-surface border border-surface-light rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-surface-light flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">AI Menu Importer</h2>
                            <p className="text-xs text-muted font-medium">Convert images to digital items</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-surface-light rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                        {step === 'upload' && (
                            <div className="space-y-6 flex flex-col h-full items-center justify-center py-12">
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                                    <Camera className="w-10 h-10" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-bold">Snap or Upload</h3>
                                    <p className="text-sm text-muted max-w-xs mx-auto">
                                        Take a photo of your printed menu or upload an image to extract categories and items instantly.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm pt-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center gap-3 p-6 bg-surface-light hover:bg-surface-light/80 rounded-2xl border border-transparent hover:border-primary/30 transition-all group"
                                    >
                                        <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Upload File</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.setAttribute('capture', 'environment');
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        className="flex flex-col items-center gap-3 p-6 bg-primary/10 hover:bg-primary/20 rounded-2xl border border-primary/20 transition-all group"
                                    >
                                        <div className="p-3 bg-primary/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-primary">Take Photo</span>
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                {error && (
                                    <div className="flex items-center gap-2 text-destructive text-sm font-bold bg-destructive/10 px-4 py-2 rounded-xl mt-4">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'processing' && (
                            <div className="flex flex-col items-center justify-center py-20 space-y-8 h-full text-center">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">AI is Reading your Menu...</h3>
                                    <p className="text-sm text-muted animate-pulse">This usually takes about 5-10 seconds</p>
                                </div>
                                <div className="w-full max-w-xs bg-surface-light h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        className="w-full h-full bg-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'preview' && extractedData && (
                            <div className="space-y-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Extraction Complete
                                    </h3>
                                    <button
                                        onClick={() => setStep('upload')}
                                        className="text-xs font-bold text-muted hover:text-foreground"
                                    >
                                        Re-upload
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {extractedData.categories.map((cat: any, cIdx: number) => (
                                        <div key={cIdx} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px bg-surface-light flex-1" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{cat.title}</span>
                                                <div className="h-px bg-surface-light flex-1" />
                                            </div>
                                            <div className="grid gap-3">
                                                {cat.items.map((item: any, iIdx: number) => (
                                                    <div
                                                        key={iIdx}
                                                        className="p-4 bg-surface-light/30 border border-surface-light rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-colors"
                                                    >
                                                        <div className="min-w-0 pr-4">
                                                            <div className="text-sm font-bold truncate">{item.title}</div>
                                                            {item.description && (
                                                                <div className="text-[10px] text-muted truncate mt-0.5">{item.description}</div>
                                                            )}
                                                        </div>
                                                        <div className="font-bold text-sm shrink-0">₹{item.price}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {step === 'preview' && (
                        <div className="p-6 border-t border-surface-light bg-surface-light/20 flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-[2] bg-primary hover:bg-primary/90 text-black py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Import to Menu
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
