import { useTableStore } from "@/store/useTableStore";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { Receipt as ReceiptIcon, X, CheckCheck, Printer, ArrowRightLeft } from "lucide-react";
import { Receipt } from "./Receipt";
import { SplitBillModal } from "./SplitBillModal";
import { useRef, useEffect } from "react";

import { useState } from "react";

interface TableActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShiftTable: () => void; // Pass this down to reuse existing logic if needed
}

export function TableActionsModal({ isOpen, onClose, onShiftTable }: TableActionsModalProps) {
    const { getSelectedTable, fetchTables, selectTable } = useTableStore();
    const { clearCart } = useCartStore();
    const [isSettling, setIsSettling] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const selectedTable = getSelectedTable();

    // Fetch active order for printing
    useEffect(() => {
        if (isOpen && selectedTable) {
            fetch(`${API_URL}/orders/${selectedTable.id}/active`)
                .then(res => res.ok ? res.json() : null)
                .then(data => setActiveOrder(data))
                .catch(console.error);
        }
    }, [isOpen, selectedTable]);

    if (!isOpen || !selectedTable) return null;

    const handleSettleBill = async () => {
        if (!confirm(`Are you sure you want to settle bills for ${selectedTable.label}?`)) return;

        setIsSettling(true);
        try {
            const res = await fetch(`${API_URL}/orders/${selectedTable.id}/settle`, {
                method: 'POST'
            });

            if (res.ok) {
                alert("Bill Settled & Table Freed!");
                await fetchTables(); // Refresh status
                selectTable(selectedTable.id); // Refresh selected table status in store if needed, or just re-select
                clearCart(); // Clear local cart if it was related to this table (optional, might be risky if multiple carts)
                // Actually, if we settle, the table becomes FREE.
                onClose();
            } else {
                const err = await res.json();
                alert(`Failed to settle: ${err.message}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        } finally {
            setIsSettling(false);
        }
    };

    const handlePrintBill = () => {
        if (!activeOrder) {
            alert("No active order to print");
            return;
        }
        // Simple Print Logic: Open new window, write html, print
        const printContent = receiptRef.current?.innerHTML;
        if (printContent) {
            const win = window.open('', '', 'height=600,width=400');
            if (win) {
                win.document.write('<html><head><title>Receipt</title>');
                win.document.write('<script src="https://cdn.tailwindcss.com"></script>'); // Quick styling
                win.document.write('</head><body >');
                win.document.write(printContent);
                win.document.write('</body></html>');
                win.document.close();
                win.print();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl w-[500px] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Table Actions</h2>
                        <p className="text-muted text-sm">{selectedTable.label} • {selectedTable.status}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Actions Grid */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={handleSettleBill}
                        disabled={isSettling}
                        className="p-6 rounded-xl border-2 border-green-500/20 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center gap-3 group"
                    >
                        <div className="p-3 rounded-full bg-green-500/20 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <CheckCheck className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg text-green-500">Settle Bill</span>
                        <span className="text-xs text-muted text-center">Complete order & Free table</span>
                    </button>

                    <button
                        onClick={handlePrintBill}
                        className="p-6 rounded-xl border-2 border-border bg-surface-light hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center gap-3 group"
                    >
                        <div className="p-3 rounded-full bg-surface text-foreground group-hover:bg-primary group-hover:text-primary-fg transition-colors">
                            <Printer className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">Print Bill</span>
                        <span className="text-xs text-muted text-center">Generate receipt</span>
                    </button>

                    <button
                        onClick={() => {
                            onShiftTable();
                            onClose();
                        }}
                        className="p-6 rounded-xl border-2 border-border bg-surface-light hover:border-blue-500 hover:bg-blue-500/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center gap-3 group"
                    >
                        <div className="p-3 rounded-full bg-surface text-foreground group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">Shift Table</span>
                        <span className="text-xs text-muted text-center">Move order to another table</span>
                    </button>

                    <button
                        onClick={() => setIsSplitOpen(true)}
                        className="p-6 rounded-xl border-2 border-border bg-surface-light hover:border-purple-500 hover:bg-purple-500/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center gap-3 group"
                    >
                        <div className="p-3 rounded-full bg-surface text-foreground group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <ReceiptIcon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">Split Bill</span>
                        <span className="text-xs text-muted text-center">Partial Payment</span>
                    </button>
                </div>
            </div>
            {/* Receipt Hidden Component */}
            <Receipt ref={receiptRef} order={activeOrder} />

            {/* Split Bill Modal */}
            <SplitBillModal
                isOpen={isSplitOpen}
                onClose={() => setIsSplitOpen(false)}
                tableId={selectedTable.id}
                onSuccess={() => {
                    fetchTables(); // Refresh table status
                    // If fully settled, close parent too
                    if (activeOrder?.remaining <= 0) onClose(); // This might need check
                    // Ideally check status again or rely on table status update
                }}
            />
        </div>
    );
}
