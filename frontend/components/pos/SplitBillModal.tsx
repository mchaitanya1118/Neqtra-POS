import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { X, CreditCard, Banknote, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplitBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    tableId: number;
    onSuccess: () => void;
}

export function SplitBillModal({ isOpen, onClose, tableId, onSuccess }: SplitBillModalProps) {
    const [order, setOrder] = useState<any>(null);
    const [amount, setAmount] = useState<string>("");
    const [method, setMethod] = useState<string>("CASH");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tableId) {
            fetchOrder();
        }
    }, [isOpen, tableId]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`${API_URL}/orders/${tableId}/active`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                setAmount(data.remaining.toString()); // Default to full remaining
            } else {
                // Handle no active order or error
                setOrder(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePayment = async () => {
        if (!amount || Number(amount) <= 0) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/orders/${tableId}/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(amount), method })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'COMPLETED') {
                    alert("Bill Settled Completely & Table Freed!");
                    onSuccess();
                    onClose();
                } else {
                    alert(`Partial Payment of $${amount} Received. Remaining: $${data.remaining}`);
                    fetchOrder(); // Refresh current modal state
                    setAmount(""); // Reset input
                }
            } else {
                alert("Payment Failed");
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-surface border border-surface-light rounded-[32px] w-[450px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 border-b border-surface-light flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Split Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-full text-muted hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {order ? (
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Total Amount:</span>
                                <span className="font-bold">${Number(order.totalAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-500">
                                <span>Paid So Far:</span>
                                <span className="font-bold">${order.totalPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-dashed border-surface-light pt-4 text-foreground">
                                <span>Remaining:</span>
                                <span>${order.remaining.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-muted uppercase tracking-wider">Payment Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-surface-light border border-transparent rounded-[20px] px-6 py-4 text-2xl font-bold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted/30"
                                placeholder="0.00"
                                max={order.remaining}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {['CASH', 'CARD', 'UPI'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMethod(m)}
                                    className={cn(
                                        "p-3 rounded-[16px] border text-xs font-bold transition-all uppercase tracking-wider",
                                        method === m
                                            ? "bg-primary text-primary-fg border-primary shadow-[0_0_15px_rgba(105,215,189,0.3)]"
                                            : "bg-surface-light border-transparent text-muted hover:text-foreground hover:bg-surface-light/80"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading || !amount}
                            className="w-full bg-primary text-primary-fg h-14 rounded-[99px] font-bold text-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : `Pay $${Number(amount || 0).toFixed(2)}`}
                        </button>
                    </div>
                ) : (
                    <div className="p-6 text-center text-muted">Loading order details...</div>
                )}
            </div>
        </div>
    );
}
