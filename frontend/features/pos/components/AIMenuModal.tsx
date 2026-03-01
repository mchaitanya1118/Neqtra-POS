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
import apiClient from "@/lib/api";

interface AIMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIMenuModal({ isOpen, onClose }: AIMenuModalProps) {
    const [step, setStep] = useState<'upload' | 'processing' | 'done'>('upload');
    const [importResult, setImportResult] = useState<{ summary: { categoriesAdded: number; itemsAdded: number; itemsSkipped: number } } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fetchMenu = useMenuStore(state => state.fetchMenu);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            startImport(selected);
        }
    };

    const startImport = async (selectedFile: File) => {
        setStep('processing');
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await apiClient.post('/menu/ai-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportResult(res.data);
            setStep('done');
            // Refresh the menu so new items appear immediately
            await fetchMenu();
        } catch (err: any) {
            console.error('AI Import failed:', err);
            setError(err?.response?.data?.message || 'Failed to extract menu. Please try a clearer photo.');
            setStep('upload');
        }
    };

    const handleClose = () => {
        onClose();
        setStep('upload');
        setImportResult(null);
        setError(null);
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

                        {step === 'done' && importResult && (
                            <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black">Import Complete!</h3>
                                    <p className="text-sm text-muted">Your menu has been updated successfully.</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                                    <div className="bg-surface-light rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-primary">{importResult.summary.categoriesAdded}</div>
                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Categories</div>
                                    </div>
                                    <div className="bg-surface-light rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-primary">{importResult.summary.itemsAdded}</div>
                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Items Added</div>
                                    </div>
                                    <div className="bg-surface-light rounded-2xl p-4 text-center">
                                        <div className="text-2xl font-black text-muted">{importResult.summary.itemsSkipped}</div>
                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Skipped</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="bg-primary hover:bg-primary/90 text-black px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
