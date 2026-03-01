"use client";

import { X, Printer, Loader2 } from "lucide-react";
import { useState } from "react";

interface KOTPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: () => Promise<void> | void;
    order: any;
    tableLabel?: string;
}

export function KOTPreviewModal({ isOpen, onClose, onPrint, order, tableLabel }: KOTPreviewModalProps) {
    const [isPrinting, setIsPrinting] = useState(false);

    if (!isOpen || !order) return null;

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            await onPrint();
        } catch (e) {
            // Error is already handled (alert) inside handlePrint in BillingPanel
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="font-bold text-lg">KOT Preview</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto font-mono text-sm">
                    <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
                        <p className="font-bold text-xl mb-1">KITCHEN ORDER TICKET</p>
                        <p className="font-bold text-lg">Table: {tableLabel || order.tableName || 'Delivery'}</p>
                        <p className="text-xs text-gray-500">#{order.id} | {new Date().toLocaleTimeString()}</p>
                        <p className="text-xs uppercase font-bold mt-1">{order.type || 'DINE IN'}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-2">
                            <span className="w-8 text-center">Qty</span>
                            <span className="flex-1 ml-4">Item</span>
                        </div>
                        {order.items?.length === 0 && (
                            <p className="text-center text-gray-400 text-xs py-4">No items in this order.</p>
                        )}
                        {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-4">
                                <span className="w-8 text-center font-bold text-lg shrink-0">{item.quantity}x</span>
                                <span className="flex-1 font-bold">{item.menuItem?.title || item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-3">
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full py-4 px-4 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-xl font-black uppercase text-base flex items-center justify-center gap-3 shadow-lg shadow-red-900/20 disabled:opacity-70 transition-all active:scale-95"
                    >
                        {isPrinting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Printer className="w-5 h-5" /> Confirm & Print
                            </>
                        )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            disabled={isPrinting}
                            className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold uppercase text-xs disabled:opacity-50 transition-colors"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() => {
                                // We can't directly call printKOTInBrowser here because it's in BillingPanel
                                // but the onPrint prop in BillingPanel handles the logic. 
                                // Actually, BillingPanel's handlePrint already falls back to browser if bluetooth fails.
                                // However, providing a direct "Browser Print" button is better for mobile users who 
                                // know their bluetooth is flaky.
                                handlePrint();
                            }}
                            disabled={isPrinting}
                            className="py-3 px-4 border-2 border-gray-300 hover:border-gray-400 text-gray-600 rounded-xl font-bold uppercase text-[10px] disabled:opacity-50 transition-all flex items-center justify-center"
                        >
                            Browser Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
