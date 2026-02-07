"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Grid, LayoutGrid, Clock, Edit2, Trash2, CreditCard, RefreshCw, Printer, Split, ArrowRightLeft, X, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useTableStore } from "@/store/useTableStore";
import { SplitBillModal } from "@/components/pos/SplitBillModal";
import { Receipt } from "@/components/pos/Receipt";
import { API_URL } from "@/lib/config";

interface OrderItem {
    menuItem: { title: string; price: number };
    quantity: number;
}

interface ActiveOrder {
    id: number;
    tableName: string;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    // Optional properties that might come from backend or calculated
    remaining?: number;
    payments?: any[];
}

interface OrderStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
}


import { Suspense } from "react";

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<ActiveOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState<OrderStats>({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 });

    // New Actions State
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [targetTableId, setTargetTableId] = useState<string>("");
    const receiptRef = useRef<HTMLDivElement>(null);
    const { tables, fetchTables } = useTableStore();

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchOrders = async () => {
        try {
            // Fetch Orders
            const res = await fetch(`${API_URL}/orders`);
            if (res.ok) {
                const data = await res.json();
                // Filter for active orders (PENDING, CONFIRMED, PARTIAL - not COMPLETED)
                const active = data.filter((o: any) => ['PENDING', 'CONFIRMED', 'PARTIAL'].includes(o.status));
                setOrders(active);
            }

            // Fetch Stats using the new endpoint
            const statsRes = await fetch(`${API_URL}/orders/stats`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            } else {
                // Fallback or handle error silently
                console.error("Failed to fetch stats");
            }

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleDeleteOrder = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this order? This will free the table.")) return;
        setProcessing(true);
        try {
            const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchOrders();
                if (activeOrder?.id === id) setActiveOrder(null);
            } else {
                alert("Failed to cancel order");
            }
        } catch (e) { console.error(e); }
        finally { setProcessing(false); }
    };

    const handleEditOrder = (order: ActiveOrder) => {
        // Navigate to dashboard/POS to edit order
        // Pass tableName param to auto-select the table
        router.push(`/billing?tableName=${order.tableName}`);
    };

    const handlePrintBill = () => {
        const printContent = receiptRef.current?.innerHTML;
        if (printContent) {
            const win = window.open('', '', 'height=600,width=400');
            if (win) {
                win.document.write('<html><head><title>Receipt</title>');
                win.document.write('<script src="https://cdn.tailwindcss.com"></script>');
                win.document.write('</head><body>');
                win.document.write(printContent);
                win.document.write('</body></html>');
                win.document.close();
                win.print();
            }
        }
    };

    const handleShiftTable = async () => {
        if (!activeOrder || !targetTableId || !activeOrder.tableName) return;

        const currentTable = tables.find(t => t.label.toLowerCase() === activeOrder.tableName.toLowerCase());
        if (!currentTable) {
            alert(`Could not identify table for ${activeOrder.tableName}. Please ensure table exists.`);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/tables/shift`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromId: currentTable.id, toId: Number(targetTableId) })
            });
            if (res.ok) {
                alert("Table Shifted Successfully!");
                fetchOrders();
                fetchTables();
                setIsShiftOpen(false);
                setActiveOrder(null);
            } else {
                const err = await res.json();
                alert(`Shift Failed: ${err.message}`);
            }
        } catch (e) { console.error(e); }
    };

    const handleProcessPayment = async (method: string) => {
        if (!activeOrder || !activeOrder.tableName) return;
        const currentTable = tables.find(t => t.label.toLowerCase() === activeOrder.tableName.toLowerCase());
        if (!currentTable) return;

        setProcessing(true);
        try {
            // Assume full settle for quick pay buttons. 
            // If partial, backend handles via remaining or we pass explicit amount?
            // The settle endpoint logic: if amount is passed, it logs payment. If remaining <= 0, it closes order.
            // For now, let's pass a large amount or calculate remaining to ensure closure for "Quick Pay".
            // Or better, let backend handle omitted amount as "Full Settle"? 
            // Checking OrdersService: if amount is present, it adds payment. 
            // We should pass the exact remaining amount.

            // We need to fetch the fresh order details to get exact remaining before paying to avoid overpayment
            // But for simplicity in this dashboard view, we'll calculate based on what we have or fetch fresh.
            // Let's rely on backend logic or just passed total if new.
            const amount = activeOrder.remaining !== undefined ? activeOrder.remaining : activeOrder.totalAmount;

            const res = await fetch(`${API_URL}/orders/${currentTable.id}/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, method })
            });

            if (res.ok) {
                setActiveOrder(null);
                fetchOrders();
                fetchTables();
            } else {
                alert("Payment failed");
            }
        } catch (e) { console.error(e); }
        finally { setProcessing(false); }
    };

    const filtered = orders.filter(o =>
        (o.tableName || "").toLowerCase().includes(search.toLowerCase()) ||
        o.id.toString().includes(search)
    );

    const currentTableId = activeOrder && activeOrder.tableName
        ? tables.find(t => t.label.toLowerCase() === activeOrder.tableName.toLowerCase())?.id
        : null;

    return (
        <div className="p-8 max-w-full mx-auto h-screen flex flex-col overflow-hidden bg-background text-foreground">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <div className="flex items-center gap-4">
                    <button title="Refresh" onClick={fetchOrders} className="p-2 rounded-xl bg-surface border border-border hover:bg-surface-light transition-colors">
                        <RefreshCw className={cn("w-5 h-5 text-muted", loading && "animate-spin")} />
                    </button>
                    <div className="flex items-center gap-2 bg-surface p-2 rounded-xl border border-border focus-within:border-primary/50 transition-colors">
                        <Search className="w-5 h-5 text-muted ml-1" />
                        <input
                            className="bg-transparent focus:outline-none w-64 text-sm placeholder:text-muted/50"
                            placeholder="Search table or order #..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shrink-0">
                <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Grid className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-muted uppercase">Total</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold mb-1">{stats.totalOrders}</h3>
                        <p className="text-xs text-muted font-medium">Lifetime Orders</p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-500" />
                        </div>
                        <span className="text-xs font-bold text-muted uppercase">Pending</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold mb-1">{stats.pendingOrders}</h3>
                        <p className="text-xs text-muted font-medium">Requires Action</p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-xs font-bold text-muted uppercase">Completed</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold mb-1">{stats.completedOrders}</h3>
                        <p className="text-xs text-muted font-medium">Served/Paid</p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-bold text-muted uppercase">Revenue</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold mb-1">₹{stats.totalRevenue.toFixed(2)}</h3>
                        <p className="text-xs text-muted font-medium">Completed Sales</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className={cn("grid gap-6 pb-20", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                    {filtered.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onPayment={setActiveOrder}
                            onDelete={handleDeleteOrder}
                            onEdit={handleEditOrder}
                        />
                    ))}
                    {filtered.length === 0 && !loading && (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center text-muted">
                            <Grid className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-xl font-medium opacity-50">No active orders found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Receipt for Printing */}
            <div className="hidden">
                <Receipt ref={receiptRef} order={activeOrder as any} />
            </div>

            {/* Split Bill Modal */}
            {activeOrder && currentTableId && (
                <SplitBillModal
                    isOpen={isSplitOpen}
                    onClose={() => setIsSplitOpen(false)}
                    tableId={currentTableId}
                    onSuccess={() => {
                        fetchOrders();
                        // Update active order details if needed
                        // For now, closing sidebar on success to force refresh
                        if (activeOrder.remaining && activeOrder.remaining <= 0) setActiveOrder(null);
                    }}
                />
            )}

            {/* Payment Modal */}
            {activeOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end transition-opacity duration-300">
                    <div className="w-full max-w-md bg-[#1a1b1e] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-1 text-white">{activeOrder.tableName}</h2>
                                <p className="text-muted text-sm">Active Order #{activeOrder.id}</p>
                            </div>
                            <button onClick={() => setActiveOrder(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order Details */}
                        <div className="px-8 py-4 flex-1 flex flex-col">
                            <div className="space-y-4 mb-auto">
                                <div className="flex justify-between text-muted-foreground text-sm font-bold">
                                    <span>Subtotal</span>
                                    <span>₹{Number(activeOrder.totalAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-sm font-bold">
                                    <span>Tax 10%</span>
                                    <span>₹{(Number(activeOrder.totalAmount) * 0.1).toFixed(2)}</span>
                                </div>
                                {activeOrder.payments && activeOrder.payments.length > 0 && (
                                    <div className="flex justify-between text-green-500 text-sm font-bold">
                                        <span>Paid</span>
                                        <span>-₹{activeOrder.payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end border-t border-white/10 pt-6 mb-8 mt-6">
                                <span className="text-2xl font-bold text-white">Total Due</span>
                                <span className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    ₹{(activeOrder.remaining !== undefined ? Number(activeOrder.remaining) : (Number(activeOrder.totalAmount) * 1.1)).toFixed(2)}
                                </span>
                            </div>

                            {/* Shift Table Logic */}
                            {isShiftOpen && (
                                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 animate-in slide-in-from-bottom duration-200">
                                    <h4 className="text-white font-bold mb-3 text-sm">Shift to Table:</h4>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 bg-black/50 border border-white/20 rounded-lg text-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                            value={targetTableId}
                                            onChange={e => setTargetTableId(e.target.value)}
                                        >
                                            <option value="">Select Table</option>
                                            {tables.filter(t => t.id !== currentTableId && t.status === 'FREE').map(t => (
                                                <option key={t.id} value={t.id}>{t.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleShiftTable}
                                            className="px-4 py-2 bg-primary text-black font-bold rounded-lg text-sm"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setIsShiftOpen(false)}
                                            className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons Row */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <button
                                    onClick={handlePrintBill}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                >
                                    <Printer className="w-5 h-5 text-muted group-hover:text-white mb-1" />
                                    <span className="text-[10px] font-bold text-muted group-hover:text-white">Print</span>
                                </button>
                                <button
                                    onClick={() => setIsSplitOpen(true)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                >
                                    <Split className="w-5 h-5 text-muted group-hover:text-white mb-1" />
                                    <span className="text-[10px] font-bold text-muted group-hover:text-white">Split</span>
                                </button>
                                <button
                                    onClick={() => setIsShiftOpen(!isShiftOpen)}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                >
                                    <ArrowRightLeft className="w-5 h-5 text-muted group-hover:text-white mb-1" />
                                    <span className="text-[10px] font-bold text-muted group-hover:text-white">Shift</span>
                                </button>
                            </div>
                        </div>

                        {/* Payment Area */}
                        <div className="p-8 bg-[#141517]">
                            <div className="bg-[#2C2D31] rounded-3xl h-64 mb-8 flex flex-col items-center justify-center relative overflow-hidden group border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 border-2 border-white/40 rounded-full animate-ping opacity-20" />
                                    <CreditCard className="w-10 h-10 text-white" />
                                </div>
                                <p className="text-muted font-bold tracking-wide group-hover:text-white transition-colors">Tap to Pay via Terminal</p>
                            </div>

                            <div className="mb-6">
                                <p className="text-xs font-bold text-muted uppercase mb-4">Quick Pay</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {['CASH', 'CARD', 'WALLET'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => handleProcessPayment(m)}
                                            disabled={processing}
                                            className={cn(
                                                "flex flex-col items-center justify-center py-4 rounded-2xl border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                                                m === 'CARD'
                                                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                                    : "bg-[#1f2024] border-transparent text-muted hover:bg-[#2C2D31] hover:text-white"
                                            )}
                                        >
                                            <div className="mb-1 text-lg">{m === 'CASH' ? '₹' : m === 'CARD' ? '💳' : '📱'}</div>
                                            <span className="text-[10px] font-bold">{m}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveOrder(null)}
                                className="w-full py-4 text-sm font-bold text-muted hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Orders...</div>}>
            <OrdersContent />
        </Suspense>
    );
}

function OrderCard({
    order,
    onPayment,
    onDelete,
    onEdit
}: {
    order: ActiveOrder,
    onPayment: (o: ActiveOrder) => void,
    onDelete: (id: number) => void,
    onEdit: (o: ActiveOrder) => void
}) {
    return (
        <div className="bg-[#1f2024] border border-white/5 rounded-[2rem] p-6 flex flex-col h-[400px] hover:border-white/10 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase font-bold text-muted bg-white/5 px-2 py-1 rounded-lg">Active</span>
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{order.tableName}</h3>
                    <span className="text-xs text-muted font-bold opacity-60">#{order.id}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6 scrollbar-hide mask-fade-bottom">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex gap-4 items-center">
                            <span className="font-bold text-white/30 w-5 h-5 flex items-center justify-center border border-white/10 rounded-md text-xs">{item.quantity}</span>
                            <span className="font-medium text-gray-300 truncate max-w-[120px]">{item.menuItem.title}</span>
                        </div>
                        <span className="font-bold text-white/50">
                            ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="py-4 border-t border-white/5 mb-4 flex justify-between items-center bg-[#1f2024]/50 backdrop-blur-sm">
                <span className="text-sm font-medium text-muted">Subtotal</span>
                <span className="text-2xl font-bold text-white tracking-tight">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-4 gap-3 h-14 shrink-0">
                <button
                    onClick={() => onDelete(order.id)}
                    className="col-span-1 border border-white/10 rounded-2xl flex items-center justify-center text-muted hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 transition-all hover:scale-105 active:scale-95"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onEdit(order)}
                    className="col-span-1 border border-white/10 rounded-2xl flex items-center justify-center text-muted hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95"
                >
                    <Edit2 className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onPayment(order)}
                    className="col-span-2 bg-white text-black font-bold rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                    Payment
                </button>
            </div>
        </div>
    );
}
