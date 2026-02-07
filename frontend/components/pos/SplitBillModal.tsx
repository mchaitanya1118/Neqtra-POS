import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { X, CreditCard, Banknote, Wallet } from "lucide-react";

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl w-[400px] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold">Split Payment</h2>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
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
                            <div className="flex justify-between text-lg font-bold border-t border-dashed border-border pt-2">
                                <span>Remaining:</span>
                                <span>${order.remaining.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:border-primary"
                                placeholder="0.00"
                                max={order.remaining}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {['CASH', 'CARD', 'UPI'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMethod(m)}
                                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${method === m ? 'bg-primary text-primary-fg border-primary' : 'bg-surface-light border-border hover:border-primary/50'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading || !amount}
                            className="w-full bg-green-500 text-white h-12 rounded-xl font-bold text-lg hover:bg-green-600 transition-all disabled:opacity-50"
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
