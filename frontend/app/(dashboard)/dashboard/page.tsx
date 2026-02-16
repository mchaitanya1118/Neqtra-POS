"use client";

import { useEffect, useState } from "react";
import {
    DollarSign,
    ShoppingBag,
    AlertTriangle,
    UtensilsCrossed,
    CalendarDays,
    TrendingUp,
    Wallet,
    RefreshCw,
    Plus,
    Users,
    ChevronRight,
    Activity,
    Clock,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import { PnLCalendar } from "@/components/dashboard/PnLCalendar";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

interface DashboardMetrics {
    dailyRevenue: number;
    orderCount: number;
    lowStockCount: number;
    lowStockItems: Array<{ id: number, name: string, quantity: number }>;
    reservationCount: number;
    occupiedTables: number;
    totalDues: number;
    paymentStats: { method: string, total: number }[];
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuthStore();
    const router = useRouter();

    const fetchMetrics = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            } else {
                const errText = await res.text();
                setError(`Server Error: ${res.status} ${res.statusText} - ${errText}`);
                console.error("Dashboard fetch failed non-ok", res.status, errText);
            }
        } catch (e: any) {
            console.error("Failed to fetch dashboard metrics", e);
            setError(`Network Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, [token]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative selection:bg-primary/30 flex flex-col">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-10 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background/80 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-surface-light px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-serif italic tracking-tighter text-foreground">Dashboard</h1>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Live System Feed</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={fetchMetrics}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-surface-light hover:bg-surface border border-surface-light rounded-full text-xs font-bold text-foreground transition-all transform hover:scale-105 active:scale-95"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        <span>Refresh Feed</span>
                    </button>
                    <button
                        onClick={() => router.push('/billing')}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-fg rounded-full text-xs font-bold shadow-[0_0_20px_rgba(105,215,189,0.3)] hover:shadow-[0_0_30px_rgba(105,215,189,0.5)] transition-all transform hover:scale-105 active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span>New Order</span>
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8 pb-12">

                    {loading && !metrics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-48 bg-surface/20 rounded-[32px] border border-surface-light/30" />
                            ))}
                        </div>
                    ) : metrics ? (
                        <>
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard
                                    title="Daily Revenue"
                                    value={`₹${metrics.dailyRevenue.toFixed(2)}`}
                                    icon={DollarSign}
                                    trend="+12% today"
                                    color="text-primary"
                                    bg="bg-primary/10"
                                    onClick={() => router.push('/reports')}
                                />
                                <MetricCard
                                    title="Orders Today"
                                    value={metrics.orderCount.toString()}
                                    icon={ShoppingBag}
                                    trend="Live updates"
                                    color="text-blue-400"
                                    bg="bg-blue-500/10"
                                    onClick={() => router.push('/orders')}
                                />
                                <MetricCard
                                    title="Occupied Tables"
                                    value={metrics.occupiedTables.toString()}
                                    icon={UtensilsCrossed}
                                    trend="Instant occupancy"
                                    color="text-amber-400"
                                    bg="bg-amber-500/10"
                                    onClick={() => router.push('/tables')}
                                />
                                <MetricCard
                                    title="Total Dues"
                                    value={`₹${metrics.totalDues ? metrics.totalDues.toFixed(2) : '0.00'}`}
                                    icon={Wallet}
                                    trend="Awaiting settlement"
                                    color="text-red-400"
                                    bg="bg-red-500/10"
                                    onClick={() => router.push('/dues')}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* System Feed & Stock Alert */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-surface/30 backdrop-blur-md border border-surface-light rounded-[32px] p-8 shadow-sm hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                                                    <AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold font-serif italic text-foreground tracking-tight">Critical Inventory</h2>
                                                    <p className="text-xs text-muted font-bold uppercase tracking-widest">{metrics.lowStockCount} Items Below Threshold</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push('/inventory')}
                                                className="px-4 py-2 border border-surface-light bg-surface-light/50 hover:bg-surface-light rounded-full text-[10px] font-bold text-muted hover:text-foreground uppercase tracking-widest transition-all"
                                            >
                                                Manage Stock
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {metrics.lowStockItems.length === 0 ? (
                                                <div className="col-span-full border border-dashed border-surface-light/50 rounded-2xl p-6 text-center">
                                                    <p className="text-muted text-sm font-medium">All inventory levels are healthy.</p>
                                                </div>
                                            ) : (
                                                metrics.lowStockItems.map(item => (
                                                    <div key={item.id} className="group flex items-center justify-between p-4 bg-background/40 hover:bg-background/60 rounded-2xl border border-surface-light transition-all cursor-pointer">
                                                        <div>
                                                            <span className="block font-bold text-foreground text-sm">{item.name}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">Inventory ID: #{item.id}</span>
                                                        </div>
                                                        <span className="text-red-400 font-bold bg-red-500/10 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-tighter border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-all">
                                                            {item.quantity} units left
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* PnL Calendar integration */}
                                    <PnLCalendar />
                                </div>

                                {/* Sidebar Column: Quick Actions & Status */}
                                <div className="space-y-8">
                                    {/* Quick Actions Panel */}
                                    <div className="bg-surface/30 backdrop-blur-md border border-surface-light rounded-[32px] p-8 shadow-sm">
                                        <h2 className="text-xl font-bold font-serif italic text-foreground tracking-tight mb-6">Quick Actions</h2>
                                        <div className="space-y-3">
                                            <QuickActionBtn
                                                icon={Plus}
                                                label="New Reservation"
                                                onClick={() => router.push('/reservations')}
                                            />
                                            <QuickActionBtn
                                                icon={Users}
                                                label="Manage Staff"
                                                onClick={() => router.push('/users')}
                                            />
                                            <QuickActionBtn
                                                icon={Activity}
                                                label="Daily Audit"
                                                onClick={() => router.push('/accounting')}
                                            />
                                            <QuickActionBtn
                                                icon={UtensilsCrossed}
                                                label="Update Menu"
                                                onClick={() => router.push('/menu')}
                                            />
                                        </div>
                                    </div>

                                    {/* System Status */}
                                    <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 shadow-sm">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-fg flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Activity className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold font-serif italic text-foreground">Cloud Node</h2>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Operational</p>
                                            </div>
                                        </div>
                                        <div className="space-y-5">
                                            <StatusItem label="Database Gateway" active />
                                            <StatusItem label="WebSocket Uplink" active />
                                            <StatusItem label="KDS Integration" active />
                                            <StatusItem label="Payment Processor" active />
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-primary/10 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Runtime Duration</span>
                                            <span className="text-xs font-mono font-bold text-foreground">142:52:12</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Analytics Row */}
                            <div className="bg-surface/30 backdrop-blur-md border border-surface-light rounded-[32px] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold font-serif italic text-foreground tracking-tight flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        Settlement Breakdown
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {(metrics.paymentStats || []).map((stat) => (
                                        <div key={stat.method} className="bg-background/40 p-6 rounded-[24px] flex flex-col gap-2 border border-surface-light group hover:border-primary/30 transition-all hover:scale-[1.02] cursor-default">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{stat.method.replace('_', ' ')}</span>
                                            <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">₹{stat.total.toFixed(2)}</span>
                                            <div className="w-full h-1 bg-surface-light rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-primary/30 w-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                                            </div>
                                        </div>
                                    ))}
                                    {(!metrics.paymentStats || metrics.paymentStats.length === 0) && (
                                        <div className="col-span-full border border-dashed border-surface-light/50 rounded-2xl p-8 text-center">
                                            <p className="text-muted text-sm font-medium">No settlements initiated today.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                            <h3 className="text-xl font-bold text-foreground">Stream Interrupted</h3>
                            <p className="text-muted text-sm mt-2">Failed to synchronize dashboard metrics.</p>
                            {error && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-lg mx-auto">
                                    <p className="text-red-400 font-mono text-xs">{error}</p>
                                </div>
                            )}
                            <button onClick={fetchMetrics} className="mt-6 px-6 py-2 bg-surface border border-surface-light rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-light transition-all">Retry Synchronization</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

}

function MetricCard({ title, value, icon: Icon, trend, color, bg, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="bg-surface/30 backdrop-blur-md border border-surface-light rounded-[32px] p-8 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-2xl hover:border-primary/30 group cursor-pointer active:scale-95"
        >
            <div className="flex items-start justify-between mb-8">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-transparent group-hover:border-white/10 group-hover:shadow-[0_0_20px_rgba(105,215,189,0.15)]", bg, color)}>
                    <Icon className="w-7 h-7" />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold bg-background/50 backdrop-blur-sm border border-surface-light px-3 py-1.5 rounded-full text-muted tracking-widest uppercase">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted mb-2 uppercase tracking-widest opacity-80">{title}</p>
                <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-bold tracking-tighter text-foreground group-hover:text-primary transition-colors font-serif italic">{value}</h3>
                    <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-all transform group-hover:translate-x-1" />
                </div>
            </div>
        </div>
    );
}

function QuickActionBtn({ icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-background/40 hover:bg-primary/10 border border-surface-light hover:border-primary/30 rounded-2xl transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-light text-muted group-hover:bg-primary group-hover:text-primary-fg flex items-center justify-center transition-all">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-all transform group-hover:translate-x-1" />
        </button>
    );
}

function StatusItem({ label, active }: { label: string, active?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-widest">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-foreground/80">CONNECTED</span>
                <div className={cn("w-2 h-2 rounded-full", active ? "bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" : "bg-muted")} />
            </div>
        </div>
    );
}
