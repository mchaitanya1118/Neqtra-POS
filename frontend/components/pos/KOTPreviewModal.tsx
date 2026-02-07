"use client";

import { X, Printer } from "lucide-react";

interface KOTPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: () => void;
    order: any;
    tableLabel?: string;
}

export function KOTPreviewModal({ isOpen, onClose, onPrint, order, tableLabel }: KOTPreviewModalProps) {
    if (!isOpen || !order) return null;

    // Filter only new items if we had a way to distinguish, 
    // but typically KOT shows what was just added. 
    // Since we are triggering this right after "Place Order", 
    // we might want to show all items or just the ones being sent.
    // For simplicity, let's show all items in the current order (which is effectively the "KOT" content if it's a new order).
    // If it's an update, technically KOT should only show *new* items.
    // However, the backend doesn't explicitly flag "new" items in the order object unless we diff.
    // But usually in this flow, we just show the whole order as the "current KOT" or better, let's just show the full order for confirmation.
    // Wait, requirement: "display the KOT for confirmation".

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
                        <p className="font-bold text-lg">Table: {tableLabel || order.tableName}</p>
                        <p className="text-xs text-gray-500">#{order.id} | {new Date().toLocaleTimeString()}</p>
                        <p className="text-xs uppercase font-bold mt-1">{order.type || 'DINE IN'}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-2">
                            <span className="flex-1">Item</span>
                            <span className="w-8 text-center">Qty</span>
                        </div>
                        {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start">
                                <span className="flex-1 font-bold">{item.menuItem?.title || item.title}</span>
                                <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-3 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold uppercase text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onPrint}
                        className="py-3 px-4 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded font-bold uppercase text-sm flex items-center justify-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Confirm & Print
                    </button>
                </div>
            </div>
        </div>
    );
}
