"use client";

import { memo, useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Search,
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
import { SplitBillModal } from "@/features/pos/components/SplitBillModal";
import { Receipt } from "@/features/pos/components/Receipt";
import apiClient from "@/lib/api";
import { Suspense } from "react";
import { FixedSizeGrid as VirtualGrid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

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
    const { hasPermission } = useAuthStore();
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
            const res = await apiClient.get('/orders?status=active&limit=100');
            const data = res.data.data || res.data; // Handle new paginated format
            const active = data.filter((o: any) =>
                ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'PARTIAL', 'DUE'].includes(o.status)
            );
            setOrders(active);

            const statsRes = await apiClient.get('/orders/stats');
            setStats(statsRes.data);
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
            await apiClient.delete(`/orders/${id}`);
            fetchOrders();
            if (activeOrder?.id === id) setActiveOrder(null);
        } catch (e) { console.error(e); }
        finally { setProcessing(false); }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        setProcessing(true);
        try {
            await apiClient.patch(`/orders/${id}/status`, { status });
            fetchOrders();
        } catch (e) { console.error(e); }
        finally { setProcessing(false); }
    };

    const handleEditOrder = (order: ActiveOrder) => {
        router.push(`/pos?tableName=${order.tableName}`); // Redirect to POS for editing? billing?
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
            await apiClient.post('/tables/shift', { fromId: currentTable.id, toId: Number(targetTableId) });
            fetchOrders();
            fetchTables();
            setIsShiftOpen(false);
            setActiveOrder(null);
        } catch (e) { console.error(e); }
    };

    const handleProcessPayment = async (method: string) => {
        if (!activeOrder) return;

        setProcessing(true);
        try {
            const amount = activeOrder.remaining !== undefined ? activeOrder.remaining : activeOrder.totalAmount;
            // Use activeOrder.id for settlement, not tableId
            await apiClient.post(`/orders/${activeOrder.id}/settle`, { amount, method });

            setActiveOrder(null);
            fetchOrders();
            fetchTables();
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
            <main className="flex-1 overflow-hidden px-6 pt-6 relative z-10 flex flex-col">
                <div className="w-full mx-auto space-y-6 flex-1 flex flex-col h-full min-h-0">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <SimpleStatCard label="Active Orders" value={stats.pendingOrders} icon={Activity} color="text-amber-400" bg="bg-amber-500/10" />
                        <SimpleStatCard label="Served Today" value={stats.completedOrders} icon={CheckCircle} color="text-primary" bg="bg-primary/10" />
                        <SimpleStatCard label="Total Feed" value={stats.totalOrders} icon={ChefHat} color="text-blue-400" bg="bg-blue-500/10" />
                        <SimpleStatCard label="Daily Revenue" value={`₹${stats.totalRevenue.toFixed(0)}`} icon={DollarSign} color="text-purple-400" bg="bg-purple-500/10" />
                    </div>

                    {/* Orders Grid */}
                    <div className="flex-1 w-full h-full min-h-0 relative -mx-2">
                        {filtered.length === 0 && !loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-surface/30 rounded-full flex items-center justify-center mb-6">
                                    <Box className="w-10 h-10 text-muted/50" />
                                </div>
                                <h3 className="text-2xl font-bold font-serif italic text-foreground mb-2">No Active Orders</h3>
                                <p className="text-muted max-w-sm mx-auto">All tables seem clear. New orders will appear here automatically.</p>
                            </div>
                        ) : (
                            <AutoSizer>
                                {({ height, width }: { height: number; width: number }) => {
                                    if (!width || !height) return null;

                                    let columnCount = 1;
                                    if (width >= 1536) columnCount = 5; // 2xl
                                    else if (width >= 1280) columnCount = 4; // xl
                                    else if (width >= 1024) columnCount = 3; // lg
                                    else if (width >= 768) columnCount = 2; // md

                                    const rowCount = Math.ceil(filtered.length / columnCount);
                                    const columnWidth = width / columnCount;

                                    return (
                                        <VirtualGrid
                                            columnCount={columnCount}
                                            columnWidth={columnWidth}
                                            height={height}
                                            rowCount={rowCount}
                                            rowHeight={550} // 520 Card + 30 Gap
                                            width={width}
                                            className="custom-scrollbar"
                                            style={{ overflowX: 'hidden' }}
                                        >
                                            {({ columnIndex, rowIndex, style }: any) => {
                                                const index = rowIndex * columnCount + columnIndex;
                                                if (index >= filtered.length) return null;
                                                const order = filtered[index];

                                                return (
                                                    <div style={{ ...style, padding: '12px' }} key={order.id}>
                                                        <OrderCard
                                                            order={order}
                                                            onPayment={setActiveOrder}
                                                            onDelete={handleDeleteOrder}
                                                            onEdit={handleEditOrder}
                                                            onUpdateStatus={handleUpdateStatus}
                                                        />
                                                    </div>
                                                );
                                            }}
                                        </VirtualGrid>
                                    );
                                }}
                            </AutoSizer>
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
                        if (activeOrder.remaining !== undefined && activeOrder.remaining <= 0) setActiveOrder(null);
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
                                            <button
                                                onClick={handleShiftTable}
                                                disabled={!hasPermission('Table Services')}
                                                className="flex-1 py-3 bg-primary disabled:opacity-50 text-primary-fg rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                            >
                                                Confirm Shift
                                            </button>
                                            <button
                                                onClick={() => setIsSplitOpen(true)}
                                                disabled={!hasPermission('Billing')}
                                                className="flex-1 py-3 bg-surface disabled:opacity-50 border border-surface-light text-foreground rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-surface-light"
                                            >
                                                Split Bill
                                            </button>
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
                                        disabled={processing || !hasPermission('Billing')}
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

const SimpleStatCard = memo(function SimpleStatCard({ label, value, icon: Icon, color, bg }: any) {
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
});

const OrderCard = memo(function OrderCard({ order, onPayment, onDelete, onEdit, onUpdateStatus }: any) {
    const { hasPermission } = useAuthStore();
    const status = order.status;

    return (
        <div className="group relative bg-surface/30 hover:bg-surface/50 backdrop-blur-md border border-surface-light hover:border-primary/30 rounded-[32px] p-6 transition-all duration-300 hover:shadow-2xl flex flex-col h-[520px]">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold font-serif italic text-foreground group-hover:text-primary transition-colors tracking-tight">{order.tableName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted">ID#{String(order.id).slice(-4)}</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                            status === 'PENDING' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                status === 'CONFIRMED' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                    status === 'PREPARING' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                                        status === 'READY' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                            "bg-primary/10 text-primary border-primary/20"
                        )}>
                            {status}
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
            <div className="grid grid-cols-4 gap-2">
                <button
                    onClick={() => onDelete(order.id)}
                    disabled={!hasPermission('Orders')}
                    className="col-span-1 h-10 rounded-xl bg-surface-light hover:bg-red-500/10 border border-surface-light hover:border-red-500/30 flex items-center justify-center text-muted hover:text-red-400 transition-all active:scale-95 disabled:opacity-30"
                    title="Cancel Order"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onEdit(order)}
                    disabled={!hasPermission('Orders')}
                    className="col-span-1 h-10 rounded-xl bg-surface-light hover:bg-surface border border-surface-light flex items-center justify-center text-muted hover:text-primary transition-all active:scale-95 disabled:opacity-30"
                    title="Edit Order"
                >
                    <Edit2 className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onPayment(order)}
                    disabled={!hasPermission('Billing')}
                    className="col-span-2 h-10 rounded-xl bg-surface hover:bg-surface-light border border-surface-light hover:border-surface text-foreground font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay</span>
                </button>

                {/* Status Transitions */}
                <div className="col-span-full flex gap-2">
                    {status === 'PENDING' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                            disabled={order.items.length === 0}
                            className="flex-1 h-10 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm
                        </button>
                    )}
                    {status === 'CONFIRMED' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                            className="flex-1 h-10 bg-purple-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all"
                        >
                            Start Prep
                        </button>
                    )}
                    {status === 'PREPARING' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'READY')}
                            className="flex-1 h-10 bg-green-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all"
                        >
                            Ready
                        </button>
                    )}
                    {status === 'READY' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'SERVED')}
                            className="flex-1 h-10 bg-primary text-primary-fg rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                        >
                            Serve
                        </button>
                    )}
                    {status === 'SERVED' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                            disabled={(order.remaining !== undefined ? Number(order.remaining) : Number(order.totalAmount)) > 0.01}
                            className="flex-1 h-10 bg-gray-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title={(order.remaining !== undefined ? Number(order.remaining) : Number(order.totalAmount)) > 0.01 ? "Settle payment first" : "Complete Order"}
                        >
                            Complete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});
