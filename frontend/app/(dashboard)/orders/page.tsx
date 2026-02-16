"use client";

import { useEffect, useState, useRef } from "react";
import {
    Search,
    Grid,
    LayoutGrid,
    Clock,
    Edit2,
    Trash2,
    CreditCard,
    RefreshCw,
    Printer,
    Split,
    ArrowRightLeft,
    X,
    TrendingUp,
    CheckCircle2,
    CheckCircle,
    Utensils,
    Activity,
    ChefHat,
    DollarSign,
    Box,
    LayoutDashboard,
    ChevronRight,
    SearchIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useTableStore } from "@/store/useTableStore";
import { SplitBillModal } from "@/components/pos/SplitBillModal";
import { Receipt } from "@/components/pos/Receipt";
import { API_URL } from "@/lib/config";
import { Suspense } from "react";

interface OrderItem {
    menuItem: { title: string; price: number };
    quantity: number;
    status: string;
}

interface ActiveOrder {
    id: number;
    tableName: string;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    status: string;
    remaining?: number;
    payments?: any[];
}

interface OrderStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
}

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<ActiveOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState<OrderStats>({ totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 });

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
            const res = await fetch(`${API_URL}/orders`);
            if (res.ok) {
                const data = await res.json();
                const active = data.filter((o: any) => ['PENDING', 'CONFIRMED', 'PARTIAL'].includes(o.status));
                setOrders(active);
            }

            const statsRes = await fetch(`${API_URL}/orders/stats`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleDeleteOrder = async (id: number) => {
        setProcessing(true);
        try {
            const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchOrders();
                if (activeOrder?.id === id) setActiveOrder(null);
            }
        } catch (e) { console.error(e); }
        finally { setProcessing(false); }
    };

    const handleMarkServed = async (id: number) => {
        setProcessing(true);
        try {
            const res = await fetch(`${API_URL}/orders/${id}/serve`, { method: 'POST' });
            if (res.ok) {
                fetchOrders();
            }
        } catch (e) { console.error(e); }
        finally { setProcessing(false); }
    };

    const handleEditOrder = (order: ActiveOrder) => {
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
        if (!currentTable) return;

        try {
            const res = await fetch(`${API_URL}/tables/shift`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromId: currentTable.id, toId: Number(targetTableId) })
            });
            if (res.ok) {
                fetchOrders();
                fetchTables();
                setIsShiftOpen(false);
                setActiveOrder(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleProcessPayment = async (method: string) => {
        if (!activeOrder || !activeOrder.tableName) return;
        const currentTable = tables.find(t => t.label.toLowerCase() === activeOrder.tableName.toLowerCase());
        if (!currentTable) return;

        setProcessing(true);
        try {
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
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative selection:bg-primary/30 flex flex-col">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background/80 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-surface-light px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold font-serif italic tracking-tighter text-foreground">Orders</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Feed</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={fetchOrders}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-light hover:bg-surface border border-surface-light rounded-full text-[10px] font-bold text-foreground transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        <span>Refresh</span>
                    </button>
                    <div className="relative group w-full sm:w-64">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            className="w-full pl-11 pr-4 py-2.5 bg-surface-light/50 border border-surface-light/50 focus:border-primary/50 rounded-full text-sm text-foreground placeholder:text-muted focus:outline-none transition-all ring-1 ring-transparent focus:ring-primary/20 backdrop-blur-sm"
                            placeholder="Find Order..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 custom-scrollbar">
                <div className="max-w-full mx-auto space-y-8 pb-20">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <SimpleStatCard label="Active Orders" value={stats.pendingOrders} icon={Activity} color="text-amber-400" bg="bg-amber-500/10" />
                        <SimpleStatCard label="Served Today" value={stats.completedOrders} icon={CheckCircle} color="text-primary" bg="bg-primary/10" />
                        <SimpleStatCard label="Total Feed" value={stats.totalOrders} icon={ChefHat} color="text-blue-400" bg="bg-blue-500/10" />
                        <SimpleStatCard label="Daily Revenue" value={`₹${stats.totalRevenue.toFixed(0)}`} icon={DollarSign} color="text-purple-400" bg="bg-purple-500/10" />
                    </div>

                    {/* Orders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filtered.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onPayment={setActiveOrder}
                                onDelete={handleDeleteOrder}
                                onEdit={handleEditOrder}
                                onServe={handleMarkServed}
                            />
                        ))}
                        {filtered.length === 0 && !loading && (
                            <div className="col-span-full h-96 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-surface/30 rounded-full flex items-center justify-center mb-6">
                                    <Box className="w-10 h-10 text-muted/50" />
                                </div>
                                <h3 className="text-2xl font-bold font-serif italic text-foreground mb-2">No Active Orders</h3>
                                <p className="text-muted max-w-sm mx-auto">All tables seem clear. New orders will appear here automatically.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

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
                        if (activeOrder.remaining && activeOrder.remaining <= 0) setActiveOrder(null);
                    }}
                />
            )}

            {/* Global Modals: Payment Panel */}
            {activeOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveOrder(null)} />
                    <div className="relative w-full max-w-md bg-surface/90 backdrop-blur-xl border-l border-surface-light h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        {/* Panel Header */}
                        <div className="p-8 pb-6 border-b border-surface-light">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="text-3xl font-bold font-serif italic text-foreground tracking-tight">{activeOrder.tableName}</h2>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Order Settlement Payload</p>
                                </div>
                                <button onClick={() => setActiveOrder(null)} className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-muted hover:text-foreground transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted">REF_ID: #ORD_{String(activeOrder.id).padStart(5, '0')}</span>
                                <span className="text-[10px] font-mono text-primary font-bold">{activeOrder.status}</span>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="bg-background/40 rounded-[24px] p-6 border border-surface-light space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-muted uppercase tracking-wider">Subtotal</span>
                                    <span className="text-lg font-bold text-foreground">₹{Number(activeOrder.totalAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-muted uppercase tracking-wider">Taxation (10%)</span>
                                    <span className="text-lg font-bold text-foreground">₹{(Number(activeOrder.totalAmount) * 0.1).toFixed(2)}</span>
                                </div>
                                {activeOrder.payments && activeOrder.payments.length > 0 && (
                                    <div className="flex justify-between items-center border-t border-surface-light pt-4">
                                        <span className="text-sm font-bold text-primary uppercase tracking-wider">Credits Applied</span>
                                        <span className="text-lg font-bold text-primary">-₹{activeOrder.payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-end justify-between py-6">
                                <div>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Outstanding</p>
                                    <h3 className="text-5xl font-bold font-serif italic text-foreground tracking-tighter">
                                        ₹{(activeOrder.remaining !== undefined ? Number(activeOrder.remaining) : (Number(activeOrder.totalAmount) * 1.1)).toFixed(2)}
                                    </h3>
                                </div>
                                <button onClick={handlePrintBill} className="w-14 h-14 rounded-2xl bg-surface-light hover:bg-surface border border-surface-light flex items-center justify-center text-muted hover:text-foreground transition-all">
                                    <Printer className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Shifting Area */}
                            <div className="pt-6 border-t border-surface-light">
                                <button
                                    onClick={() => setIsShiftOpen(!isShiftOpen)}
                                    className="w-full py-4 bg-background/40 hover:bg-background/80 border border-surface-light rounded-2xl flex items-center justify-between px-6 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ArrowRightLeft className="w-4 h-4 text-muted group-hover:text-primary" />
                                        <span className="text-sm font-bold text-foreground">Shift Table Payload</span>
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 text-muted group-hover:text-primary transition-transform", isShiftOpen && "rotate-90")} />
                                </button>

                                {isShiftOpen && (
                                    <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 animate-in slide-in-from-top duration-300">
                                        <select
                                            className="w-full bg-background/80 border border-primary/30 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                                            value={targetTableId}
                                            onChange={e => setTargetTableId(e.target.value)}
                                        >
                                            <option value="">Select Destination</option>
                                            {tables.filter(t => t.id !== currentTableId && t.status === 'FREE').map(t => (
                                                <option key={t.id} value={t.id}>{t.label}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <button onClick={handleShiftTable} className="flex-1 py-3 bg-primary text-primary-fg rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">Confirm Shift</button>
                                            <button onClick={() => setIsSplitOpen(true)} className="flex-1 py-3 bg-surface border border-surface-light text-foreground rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-surface-light">Split Bill</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Footer */}
                        <div className="p-8 bg-surface-light/30 border-t border-surface-light">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6">Execution Interface</p>
                            <div className="grid grid-cols-3 gap-3">
                                {['CASH', 'CARD', 'WALLET'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleProcessPayment(m)}
                                        disabled={processing}
                                        className={cn(
                                            "flex flex-col items-center justify-center py-5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50",
                                            m === 'CARD'
                                                ? "bg-primary text-primary-fg border-primary shadow-lg shadow-primary/20"
                                                : "bg-surface border-surface-light text-muted hover:text-foreground hover:bg-surface/50"
                                        )}
                                    >
                                        <div className="mb-2">
                                            {m === 'CASH' && <DollarSign className="w-5 h-5" />}
                                            {m === 'CARD' && <CreditCard className="w-5 h-5" />}
                                            {m === 'WALLET' && <Activity className="w-5 h-5" />}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest uppercase">{m}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background text-primary animate-pulse">Establishing Order Link...</div>}>
            <OrdersContent />
        </Suspense>
    );
}

function SimpleStatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-surface/30 backdrop-blur-md border border-surface-light rounded-[32px] p-6 flex flex-col justify-between hover:border-primary/20 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg, color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">{label}</span>
            </div>
            <h3 className="text-2xl font-bold font-serif italic text-foreground">{value}</h3>
        </div>
    );
}

function OrderCard({ order, onPayment, onDelete, onEdit, onServe }: any) {
    const isPending = order.items.some((i: any) => i.status === 'PENDING');

    return (
        <div className="group relative bg-surface/30 hover:bg-surface/50 backdrop-blur-md border border-surface-light hover:border-primary/30 rounded-[32px] p-6 transition-all duration-300 hover:shadow-2xl flex flex-col h-[480px]">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold font-serif italic text-foreground group-hover:text-primary transition-colors tracking-tight">{order.tableName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted">ID#{String(order.id).slice(-4)}</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                            isPending ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                        )}>
                            {isPending ? 'Action Required' : 'Ready'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6 custom-scrollbar text-sm">
                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center group/item p-2 rounded-xl hover:bg-background/40 transition-all">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-surface-light flex items-center justify-center text-[10px] font-bold text-muted border border-surface-light/50">
                                {item.quantity}
                            </span>
                            <span className="font-medium text-foreground/80 group-hover/item:text-foreground">{item.menuItem.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {item.status === 'SERVED' && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            <span className="text-xs font-bold text-muted">₹{(item.menuItem.price * item.quantity).toFixed(0)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Footer */}
            <div className="py-4 border-t border-surface-light/50 flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Calculated Total</span>
                <span className="text-2xl font-bold text-foreground font-serif italic">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-4 gap-3">
                <button
                    onClick={() => onDelete(order.id)}
                    className="col-span-1 h-12 rounded-2xl bg-surface-light hover:bg-red-500/10 border border-surface-light hover:border-red-500/30 flex items-center justify-center text-muted hover:text-red-400 transition-all active:scale-95"
                    title="Cancel Order"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
                <div className="col-span-1 flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(order)}
                        className="h-full rounded-2xl bg-surface-light hover:bg-surface border border-surface-light flex items-center justify-center text-muted hover:text-primary transition-all active:scale-95"
                        title="Edit Order"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={() => onPayment(order)}
                    className="col-span-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-fg font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay</span>
                </button>

                {isPending && (
                    <button
                        onClick={() => onServe(order.id)}
                        className="col-span-full mt-1 bg-surface-light hover:bg-primary/10 border border-surface-light hover:border-primary/30 py-3 rounded-2xl text-[10px] font-bold text-muted hover:text-primary uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <ChefHat className="w-4 h-4" />
                        Mark All Served
                    </button>
                )}
            </div>
        </div>
    );
}
